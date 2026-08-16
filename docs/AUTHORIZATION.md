# Authorization Model

## Identity
Identity strictly comes from the Supabase JWT. Fake identities are completely banned.

## Platform Roles
Managed by the backend `Role` and `UserRole` tables:
- **USER**: Default role for new sign-ups.
- **TOUR_PLANNER**: Can manage Tours and Reservations.
- **MODERATOR**: Community moderation privileges.
- **ADMIN**: Global system administration.

## Trip Roles (Resource Level)
Managed by the backend `TripMember` table:
- **OWNER**: Creator of the trip. Full access.
- **ADMIN**: Granted by OWNER. Can invite/manage.
- **MEMBER**: Standard participant.
- **VIEWER**: Read-only access.

## Guiding Principles
- IDOR (Insecure Direct Object Reference) is prevented by checking the `current_user` against the requested resource's ownership/membership in every single relevant API endpoint.
- The UI adapts to these roles but NEVER enforces security.
