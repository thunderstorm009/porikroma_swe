from __future__ import annotations
"""Canonical resource paths retained alongside nested trip paths.

``/api/v1/itinerary/{id}`` and ``/api/v1/trips/itinerary/{id}`` (etc.) are the same
operation. The handlers live in ``trips.py``; this module only registers the
shorter paths so the two can never drift apart again.
"""

from fastapi import APIRouter, status

from app.api.routes import trips

router = APIRouter(tags=["Trips"])

_NO_CONTENT = status.HTTP_204_NO_CONTENT

router.add_api_route("/itinerary/{item_id}", trips.update_itinerary, methods=["PATCH"], summary="Update an itinerary item")
router.add_api_route("/itinerary/{item_id}", trips.delete_itinerary, methods=["DELETE"], status_code=_NO_CONTENT, summary="Delete an itinerary item")
router.add_api_route("/expenses/{expense_id}", trips.update_expense, methods=["PATCH"], summary="Update an owned expense")
router.add_api_route("/expenses/{expense_id}", trips.delete_expense, methods=["DELETE"], status_code=_NO_CONTENT, summary="Delete an owned expense")
router.add_api_route("/packing/{item_id}", trips.update_packing, methods=["PATCH"], summary="Update a packing item")
router.add_api_route("/packing/{item_id}", trips.delete_packing, methods=["DELETE"], status_code=_NO_CONTENT, summary="Delete a packing item")
router.add_api_route("/journal/{entry_id}", trips.update_journal, methods=["PATCH"], summary="Update an owned journal entry")
router.add_api_route("/journal/{entry_id}", trips.delete_journal, methods=["DELETE"], status_code=_NO_CONTENT, summary="Delete an owned journal entry")
router.add_api_route("/photos/{photo_id}", trips.delete_photo, methods=["DELETE"], status_code=_NO_CONTENT, summary="Delete an owned trip photo")
