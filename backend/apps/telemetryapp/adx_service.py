import os
from azure.kusto.data import KustoConnectionStringBuilder, KustoClient
from dotenv import load_dotenv
import logging

# Configure logging - reduce verbosity for production
logger = logging.getLogger(__name__)

load_dotenv()

cluster = os.getenv("ADX_CLUSTER_URI")
database = os.getenv("ADX_DATABASE")
client_id = os.getenv("ADX_CLIENT_ID")
client_secret = os.getenv("ADX_CLIENT_SECRET")
tenant_id = os.getenv("ADX_TENANT_ID")

# Build connection string
kcsb = KustoConnectionStringBuilder.with_aad_application_key_authentication(
    cluster, client_id, client_secret, tenant_id
)

client = KustoClient(kcsb)

def query_adx(kql_query):
    """Execute a KQL query against Azure Data Explorer."""
    try:
        response = client.execute(database, kql_query)
        table = response.primary_results[0]
        rows = table.to_dict()
        # Return the data portion of the result
        return rows
    except Exception as e:
        logger.error(f"ADX query failed: {e}")
        return []
        