"""OpenWeather integration kept outside route handlers."""

from datetime import date

import httpx

from app.core.config import get_settings


class ExternalServiceError(RuntimeError):
    pass


def forecast(latitude: float, longitude: float, requested_date: date | None = None) -> dict:
    key = get_settings().openweather_api_key
    if not key:
        raise ExternalServiceError("Weather service is not configured")
    try:
        with httpx.Client(timeout=8) as client:
            response = client.get("https://api.openweathermap.org/data/2.5/forecast", params={"lat": latitude, "lon": longitude, "appid": key, "units": "metric"})
            response.raise_for_status()
            return {"date": requested_date, "latitude": latitude, "longitude": longitude, "forecast": response.json().get("list", [])}
    except (httpx.HTTPError, ValueError) as exc:
        raise ExternalServiceError("Weather service is temporarily unavailable") from exc
