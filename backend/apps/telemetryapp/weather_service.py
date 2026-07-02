# apps/telemetryapp/weather_service.py
# ---------------------------------------------------------------------------
# Location, timezone, and weather lookups for the dashboard.
#
# Uses two keyless public APIs:
#   * Zippopotam.us  — ZIP/postal code -> latitude/longitude/place name.
#   * Open-Meteo     — latitude/longitude -> IANA timezone + hourly weather
#                      (temperature, cloud cover, precipitation, shortwave
#                      solar radiation / irradiance, and a weather code).
#
# Both are free and require no signup. All outbound calls are made to fixed,
# hard-coded hosts with short timeouts (no user-controlled URLs -> no SSRF).
# ---------------------------------------------------------------------------

from __future__ import annotations

import re
from datetime import date, datetime, timedelta
from typing import Any

import requests

# Fixed upstream endpoints (never built from user input beyond path/query args).
ZIPPOPOTAM_URL = "https://api.zippopotam.us/{country}/{zip}"
OPEN_METEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast"

# Open-Meteo's forecast endpoint serves recent history (~92 days back) plus a
# short forecast window. That comfortably covers the dashboard's presets
# (up to 7 days back) without needing the separate archive endpoint.
_MAX_PAST_DAYS = 92
_MAX_FORECAST_DAYS = 16

_HOURLY_VARS = [
    "temperature_2m",
    "cloudcover",
    "precipitation",
    "shortwave_radiation",  # global horizontal irradiance (W/m^2)
    "weathercode",
]

_HTTP_TIMEOUT = 8  # seconds


class WeatherServiceError(Exception):
    """Raised when an upstream lookup fails or input is invalid."""


def _clean_zip(raw: str) -> str:
    """Validate and normalise a ZIP/postal code.

    Allows digits, letters, spaces and hyphens (covers US ZIP and many
    international postal codes) and caps the length to avoid abuse.
    """
    if not raw:
        raise WeatherServiceError("ZIP/postal code is required")
    value = str(raw).strip()
    if not re.fullmatch(r"[A-Za-z0-9 \-]{2,12}", value):
        raise WeatherServiceError("Invalid ZIP/postal code format")
    return value


def _clean_country(raw: str | None) -> str:
    """Normalise an ISO country code; default to US."""
    if not raw:
        return "us"
    value = str(raw).strip().lower()
    if not re.fullmatch(r"[a-z]{2}", value):
        raise WeatherServiceError("Invalid country code (expected 2 letters)")
    return value


def resolve_location(zip_code: str, country: str | None = None) -> dict[str, Any]:
    """Resolve a ZIP/postal code to coordinates and a human-readable place."""
    z = _clean_zip(zip_code)
    c = _clean_country(country)
    url = ZIPPOPOTAM_URL.format(country=c, zip=requests.utils.quote(z))
    try:
        resp = requests.get(url, timeout=_HTTP_TIMEOUT)
    except requests.RequestException as exc:
        raise WeatherServiceError(f"Location lookup failed: {exc}") from exc

    if resp.status_code == 404:
        raise WeatherServiceError(f"No location found for '{z}' ({c.upper()})")
    if not resp.ok:
        raise WeatherServiceError(
            f"Location lookup returned HTTP {resp.status_code}"
        )

    data = resp.json()
    places = data.get("places") or []
    if not places:
        raise WeatherServiceError(f"No location found for '{z}' ({c.upper()})")

    place = places[0]
    try:
        latitude = float(place["latitude"])
        longitude = float(place["longitude"])
    except (KeyError, TypeError, ValueError) as exc:
        raise WeatherServiceError("Location response missing coordinates") from exc

    return {
        "zip": z,
        "country": data.get("country abbreviation", c.upper()),
        "place": place.get("place name", ""),
        "state": place.get("state", ""),
        "latitude": latitude,
        "longitude": longitude,
    }


def _clamp_date_window(start: date, end: date) -> tuple[date, date]:
    """Clamp the requested date window to Open-Meteo's supported range."""
    today = datetime.utcnow().date()
    min_start = today - timedelta(days=_MAX_PAST_DAYS)
    max_end = today + timedelta(days=_MAX_FORECAST_DAYS)
    s = max(start, min_start)
    e = min(end, max_end)
    if e < s:
        e = s
    return s, e


def _parse_date(value: str) -> date:
    """Parse an ISO date or datetime string down to a calendar date."""
    if not value:
        raise WeatherServiceError("start_date and end_date are required")
    text = str(value).strip()
    # Accept full ISO datetimes; keep only the date portion.
    text = text.replace("Z", "").split("T")[0].split(" ")[0]
    try:
        return date.fromisoformat(text)
    except ValueError as exc:
        raise WeatherServiceError(f"Invalid date '{value}'") from exc


def fetch_weather(
    zip_code: str,
    start_date: str,
    end_date: str,
    country: str | None = None,
) -> dict[str, Any]:
    """Fetch hourly weather for a ZIP code across the requested date window.

    Times are returned in the location's local timezone; ``utc_offset_seconds``
    is included so the caller can convert each timestamp to an absolute instant
    and then render it in whichever display timezone is selected.
    """
    location = resolve_location(zip_code, country)
    s = _parse_date(start_date)
    e = _parse_date(end_date)
    s, e = _clamp_date_window(s, e)

    params = {
        "latitude": location["latitude"],
        "longitude": location["longitude"],
        "hourly": ",".join(_HOURLY_VARS),
        "timezone": "auto",
        "start_date": s.isoformat(),
        "end_date": e.isoformat(),
        "windspeed_unit": "ms",
    }
    try:
        resp = requests.get(
            OPEN_METEO_FORECAST_URL, params=params, timeout=_HTTP_TIMEOUT
        )
    except requests.RequestException as exc:
        raise WeatherServiceError(f"Weather lookup failed: {exc}") from exc

    if not resp.ok:
        raise WeatherServiceError(f"Weather API returned HTTP {resp.status_code}")

    data = resp.json()
    hourly = data.get("hourly") or {}

    return {
        "location": location,
        "timezone": data.get("timezone", "UTC"),
        "timezone_abbreviation": data.get("timezone_abbreviation", ""),
        "utc_offset_seconds": data.get("utc_offset_seconds", 0),
        "units": data.get("hourly_units") or {},
        "hourly": {
            "time": hourly.get("time", []),
            "temperature_2m": hourly.get("temperature_2m", []),
            "cloudcover": hourly.get("cloudcover", []),
            "precipitation": hourly.get("precipitation", []),
            "shortwave_radiation": hourly.get("shortwave_radiation", []),
            "weathercode": hourly.get("weathercode", []),
        },
    }


def fetch_timezone(zip_code: str, country: str | None = None) -> dict[str, Any]:
    """Resolve a ZIP code to its IANA timezone and current UTC offset."""
    location = resolve_location(zip_code, country)
    params = {
        "latitude": location["latitude"],
        "longitude": location["longitude"],
        "timezone": "auto",
        # Minimal payload — we only need the timezone metadata fields.
        "current_weather": "true",
    }
    try:
        resp = requests.get(
            OPEN_METEO_FORECAST_URL, params=params, timeout=_HTTP_TIMEOUT
        )
    except requests.RequestException as exc:
        raise WeatherServiceError(f"Timezone lookup failed: {exc}") from exc

    if not resp.ok:
        raise WeatherServiceError(f"Timezone API returned HTTP {resp.status_code}")

    data = resp.json()
    return {
        "location": location,
        "timezone": data.get("timezone", "UTC"),
        "timezone_abbreviation": data.get("timezone_abbreviation", ""),
        "utc_offset_seconds": data.get("utc_offset_seconds", 0),
    }
