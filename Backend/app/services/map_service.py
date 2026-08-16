"""Server-side map links and provider boundary."""

from urllib.parse import urlencode


def maps_link(latitude: float, longitude: float, label: str | None = None) -> str:
    params = {"api": "1", "destination": f"{latitude},{longitude}"}
    if label:
        params["query"] = label
    return "https://www.google.com/maps/search/?" + urlencode(params)
