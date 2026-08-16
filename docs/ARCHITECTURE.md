# Architecture

## Overview
Porikroma is a full-stack travel planning platform using:
- **Frontend**: React + Vite + TailwindCSS. (Requires routing update to React Router).
- **Backend**: FastAPI + SQLAlchemy.
- **Database**: PostgreSQL (hosted on Supabase) via Alembic migrations.
- **Authentication**: Supabase Auth with JWT bearer tokens.

## Communication Flow
React Client -> Fetch API (with Supabase JWT) -> FastAPI (Middleware + CORS) -> Service Layer -> SQLAlchemy -> PostgreSQL.

## Core Domains
- **Users**: Profiles and Roles managed via `users` and `roles` tables.
- **Trips**: `trips`, `trip_members`, `itinerary_items`, `expenses`, `messages`, `photos`.
- **Community**: Forum via `forum_questions`, `forum_answers`, `forum_replies`.
- **Tours/Providers**: For authorized `TOUR_PLANNER` roles to manage reservations.
- **AI**: Integrations for Chat and summaries via `AIConversation` and `AIMessage`.
- **Emergency**: `EmergencyLocation` and misc tools.

## Authentication & Authorization
- **Auth**: Managed completely by Supabase. JWT tokens are verified in FastAPI.
- **Roles**: Extracted on the backend via `UserRole` and `Role` models. Platform roles include `USER`, `TOUR_PLANNER`, `ADMIN`.
- **Trip Roles**: Managed within `TripMember` (e.g. `OWNER`, `MEMBER`, `VIEWER`).
