# Database Architecture

## Users & Roles
- **profiles**: Extended user information tied to Supabase Auth UUID.
- **roles**: Available platform roles (`USER`, `TOUR_PLANNER`, `MODERATOR`, `ADMIN`).
- **user_roles**: Mapping of users to their platform roles.

## Trips
- **trips**: Core trip information.
- **trip_members**: Junction table managing access (Role: `OWNER`, `MEMBER`, etc.).
- **itinerary_items**: Schedule items linked to a trip.
- **expenses**: Cost tracking linked to a trip.
- **trip_messages**: Chat system within a trip.
- **journal_entries**, **packing_items**, **trip_photos**: Additional trip resources.

## Community (Forum)
- **forum_questions**, **forum_answers**, **forum_replies**: Core discussion structures.
- **forum_tags**, **question_likes**, **answer_likes**, **question_bookmarks**, **question_followers**: Engagement systems.

## Tours & Providers
- **provider_profiles**, **provider_documents**: Business verification.
- **tours**, **tour_departures**, **tour_reservation_requests**: Formal bookable tours.

## AI & Misc
- **ai_conversations**, **ai_messages**, **ai_trip_summaries**, **ai_forum_summaries**.
- **destinations**, **hotels**, **restaurants**, **attractions**, **emergency_locations**.
- **notifications**, **audit_logs**.

Migrations are managed strictly via Alembic.
