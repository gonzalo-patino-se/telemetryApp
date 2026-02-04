"""
ADX Query Optimization Service

This module provides caching, batching, and rate limiting for Azure Data Explorer queries
to significantly reduce costs while maintaining functionality.

Cost Optimization Strategies:
1. Server-side caching with Redis/Django cache
2. Batch multiple telemetry queries into single ADX call
3. Rate limiting to prevent query storms
4. Query result deduplication
"""

import os
import json
import hashlib
import logging
from datetime import datetime, timedelta
from functools import wraps
from typing import List, Dict, Any, Optional
from threading import Lock

from azure.kusto.data import KustoConnectionStringBuilder, KustoClient
from django.core.cache import cache
from django.conf import settings

logger = logging.getLogger(__name__)

# =============================================================================
# Configuration
# =============================================================================

# Cache settings
CACHE_TTL_SECONDS = int(os.getenv('ADX_CACHE_TTL', 30))  # 30 second default cache
CACHE_TTL_HISTORICAL = int(os.getenv('ADX_CACHE_TTL_HISTORICAL', 300))  # 5 min for historical data

# Rate limiting
MAX_QUERIES_PER_MINUTE = int(os.getenv('ADX_MAX_QUERIES_PER_MINUTE', 60))
RATE_LIMIT_WINDOW = 60  # seconds

# Connection settings
cluster = os.getenv("ADX_CLUSTER_URI") or os.getenv("ADX_CLUSTER_URL")
database = os.getenv("ADX_DATABASE")
client_id = os.getenv("ADX_CLIENT_ID")
client_secret = os.getenv("ADX_CLIENT_SECRET")
tenant_id = os.getenv("ADX_TENANT_ID")

# =============================================================================
# Singleton Client with Connection Pooling
# =============================================================================

_client = None
_client_lock = Lock()


def get_adx_client() -> Optional[KustoClient]:
    """Get or create a singleton ADX client with connection reuse."""
    global _client
    
    if _client is not None:
        return _client
    
    with _client_lock:
        if _client is not None:
            return _client
            
        if not all([cluster, database, client_id, client_secret, tenant_id]):
            logger.warning("ADX configuration incomplete - some env vars missing")
            return None
            
        try:
            kcsb = KustoConnectionStringBuilder.with_aad_application_key_authentication(
                cluster, client_id, client_secret, tenant_id
            )
            _client = KustoClient(kcsb)
            logger.info("ADX client initialized successfully")
            return _client
        except Exception as e:
            logger.error(f"Failed to initialize ADX client: {e}")
            return None


# =============================================================================
# Rate Limiting
# =============================================================================

class RateLimiter:
    """Simple in-memory rate limiter for ADX queries."""
    
    def __init__(self):
        self.requests = []
        self.lock = Lock()
    
    def is_allowed(self) -> bool:
        """Check if a new query is allowed under rate limits."""
        now = datetime.now()
        cutoff = now - timedelta(seconds=RATE_LIMIT_WINDOW)
        
        with self.lock:
            # Remove old requests
            self.requests = [r for r in self.requests if r > cutoff]
            
            if len(self.requests) >= MAX_QUERIES_PER_MINUTE:
                logger.warning(f"Rate limit exceeded: {len(self.requests)} queries in last minute")
                return False
            
            self.requests.append(now)
            return True
    
    def get_current_rate(self) -> int:
        """Get current query rate."""
        now = datetime.now()
        cutoff = now - timedelta(seconds=RATE_LIMIT_WINDOW)
        
        with self.lock:
            self.requests = [r for r in self.requests if r > cutoff]
            return len(self.requests)


_rate_limiter = RateLimiter()


# =============================================================================
# Caching Utilities
# =============================================================================

def get_cache_key(query: str, prefix: str = "adx") -> str:
    """Generate a cache key from a KQL query."""
    query_hash = hashlib.md5(query.encode()).hexdigest()
    return f"{prefix}:{query_hash}"


def get_cached_result(query: str) -> Optional[List[Dict]]:
    """Get cached query result if available."""
    cache_key = get_cache_key(query)
    result = cache.get(cache_key)
    
    if result is not None:
        logger.debug(f"Cache HIT for query hash: {cache_key[-8:]}")
        return json.loads(result) if isinstance(result, str) else result
    
    logger.debug(f"Cache MISS for query hash: {cache_key[-8:]}")
    return None


def set_cached_result(query: str, result: List[Dict], ttl: int = None) -> None:
    """Cache a query result."""
    cache_key = get_cache_key(query)
    ttl = ttl or CACHE_TTL_SECONDS
    cache.set(cache_key, json.dumps(result), ttl)
    logger.debug(f"Cached result for query hash: {cache_key[-8:]} (TTL: {ttl}s)")


# =============================================================================
# Core Query Functions
# =============================================================================

def query_adx(kql_query: str, use_cache: bool = True, cache_ttl: int = None) -> List[Dict]:
    """
    Execute a KQL query against ADX with caching and rate limiting.
    
    Args:
        kql_query: The KQL query to execute
        use_cache: Whether to use caching (default: True)
        cache_ttl: Custom cache TTL in seconds (default: uses CACHE_TTL_SECONDS)
    
    Returns:
        List of dictionaries containing query results
    """
    # Check cache first
    if use_cache:
        cached = get_cached_result(kql_query)
        if cached is not None:
            return cached
    
    # Check rate limit
    if not _rate_limiter.is_allowed():
        logger.warning("Query rejected due to rate limiting")
        raise Exception("Rate limit exceeded. Please try again later.")
    
    # Execute query
    client = get_adx_client()
    if client is None:
        logger.error("ADX client not available")
        return []
    
    try:
        logger.info(f"Executing ADX query (rate: {_rate_limiter.get_current_rate()}/min)")
        response = client.execute(database, kql_query)
        table = response.primary_results[0]
        result_dict = table.to_dict()
        
        # to_dict() returns {'name': 'PrimaryResult', 'kind': ..., 'data': [list of row dicts]}
        # The actual data rows are in result_dict['data']
        rows = result_dict.get('data', [])
        
        if not isinstance(rows, list):
            logger.warning(f"Unexpected data format: {type(rows)}")
            rows = []
        
        # Cache the result
        if use_cache:
            ttl = cache_ttl or CACHE_TTL_SECONDS
            set_cached_result(kql_query, rows, ttl)
        
        logger.debug(f"Returning {len(rows)} rows")
        return rows
        
    except Exception as e:
        logger.error(f"ADX query failed: {e}")
        logger.debug(f"Failed query: {kql_query[:200]}...")
        return []
        return []


def query_adx_batch(queries: List[str], use_cache: bool = True) -> Dict[str, List[Dict]]:
    """
    Execute multiple KQL queries efficiently.
    
    For queries that can be batched (same table, same serial), combines them.
    Returns a dictionary mapping original queries to their results.
    """
    results = {}
    uncached_queries = []
    
    # Check cache for each query
    for query in queries:
        if use_cache:
            cached = get_cached_result(query)
            if cached is not None:
                results[query] = cached
            else:
                uncached_queries.append(query)
        else:
            uncached_queries.append(query)
    
    # Execute uncached queries
    for query in uncached_queries:
        results[query] = query_adx(query, use_cache=use_cache)
    
    return results


# =============================================================================
# Optimized Batch Query for Telemetry
# =============================================================================

def query_latest_telemetry_batch(
    serial: str, 
    telemetry_names: List[str],
    use_cache: bool = True
) -> Dict[str, Dict[str, Any]]:
    """
    Fetch latest values for multiple telemetry metrics in a SINGLE query.
    
    This is the key optimization - instead of 30+ individual queries,
    we make ONE query that returns all metrics at once.
    
    Args:
        serial: Device serial number
        telemetry_names: List of telemetry metric names
        use_cache: Whether to use caching
    
    Returns:
        Dictionary mapping telemetry_name to {value, localtime}
    """
    if not telemetry_names:
        return {}
    
    # Build a single optimized query that gets latest value for each metric
    # Using arg_max to get the row with the latest localtime for each name
    # Using 'contains' for flexible matching (matching original behavior)
    names_filter = " or ".join([f"name contains '{n}'" for n in telemetry_names])
    
    kql_query = f"""
    Telemetry
    | where comms_serial contains '{serial}'
    | where {names_filter}
    | summarize arg_max(localtime, value_double) by name
    | project name, localtime, value_double
    """.strip()
    
    # Check cache
    cache_key = f"batch_telemetry:{serial}:{hashlib.md5(':'.join(sorted(telemetry_names)).encode()).hexdigest()}"
    
    if use_cache:
        cached = cache.get(cache_key)
        if cached:
            logger.debug(f"Batch telemetry cache HIT for {serial}")
            return json.loads(cached) if isinstance(cached, str) else cached
    
    # Execute query
    rows = query_adx(kql_query, use_cache=False)  # Don't double-cache
    
    # Transform results into a dictionary
    # Map results back to requested names (handle 'contains' matching)
    results = {}
    
    # First, store raw results by the DB name
    db_results = {}
    for row in rows:
        name = row.get('name')
        if name:
            db_results[name] = {
                'value': row.get('value_double'),
                'localtime': row.get('localtime'),
            }
    
    # Now map each requested telemetry_name to the matching DB result
    # This handles cases where DB name contains the requested name or vice versa
    for requested_name in telemetry_names:
        # Try exact match first
        if requested_name in db_results:
            results[requested_name] = db_results[requested_name]
        else:
            # Try contains match (requested name is in DB name or DB name is in requested name)
            for db_name, db_value in db_results.items():
                if requested_name in db_name or db_name in requested_name:
                    results[requested_name] = db_value
                    break
    
    # Cache the batch result
    if use_cache:
        cache.set(cache_key, json.dumps(results), CACHE_TTL_SECONDS)
    
    logger.info(f"Batch query returned {len(results)}/{len(telemetry_names)} metrics for {serial}")
    return results


def query_latest_alarms_batch(
    serial: str,
    alarm_names: List[str],
    use_cache: bool = True
) -> Dict[str, Dict[str, Any]]:
    """
    Fetch latest alarm values in a single query (similar to telemetry batch).
    """
    if not alarm_names:
        return {}
    
    names_filter = " or ".join([f"name has '{n}'" for n in alarm_names])
    
    kql_query = f"""
    Alarms
    | where comms_serial contains '{serial}'
    | where {names_filter}
    | summarize arg_max(localtime, value) by name
    | project name, localtime, value
    """.strip()
    
    cache_key = f"batch_alarms:{serial}:{hashlib.md5(':'.join(sorted(alarm_names)).encode()).hexdigest()}"
    
    if use_cache:
        cached = cache.get(cache_key)
        if cached:
            return json.loads(cached) if isinstance(cached, str) else cached
    
    rows = query_adx(kql_query, use_cache=False)
    
    results = {}
    for row in rows:
        name = row.get('name')
        if name:
            results[name] = {
                'value': row.get('value'),
                'localtime': row.get('localtime'),
            }
    
    if use_cache:
        cache.set(cache_key, json.dumps(results), CACHE_TTL_SECONDS)
    
    return results


# =============================================================================
# Statistics & Monitoring
# =============================================================================

def get_query_stats() -> Dict[str, Any]:
    """Get current query statistics for monitoring."""
    return {
        'queries_last_minute': _rate_limiter.get_current_rate(),
        'max_queries_per_minute': MAX_QUERIES_PER_MINUTE,
        'cache_ttl_seconds': CACHE_TTL_SECONDS,
        'client_connected': _client is not None,
    }
