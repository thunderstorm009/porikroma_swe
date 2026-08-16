"""Distance calculation for database-backed emergency locations."""

import math


def distance_km(latitude: float, longitude: float, other_latitude: float, other_longitude: float) -> float:
    return 6371 * 2 * math.asin(math.sqrt(math.sin(math.radians(other_latitude - latitude) / 2) ** 2 + math.cos(math.radians(latitude)) * math.cos(math.radians(other_latitude)) * math.sin(math.radians(other_longitude - longitude) / 2) ** 2))
