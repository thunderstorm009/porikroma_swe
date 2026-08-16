# API Contract

## Overview
All endpoints live under `/api/v1/`.

## Authentication
Every protected request MUST attach an `Authorization: Bearer <token>` header.

## Routes (General)
- **GET /health**: Public. Returns DB connection status.
- **/auth/***: Supabase interactions or initial profile creation.
- **/users/***: User profile management.
- **/tours/***: For Tour Planners.
- **/trips/***: Trip management. Requires Platform role `USER` and specific Trip roles for accessing resources.
- **/forum/***: Community/Forum interactions.
- **/ai/***: AI Chat and interactions.
- **/admin/***: Platform `ADMIN` only routes.

## Error Handling
- **401 Unauthorized**: Missing/invalid JWT token.
- **403 Forbidden**: Valid token, but missing required Platform Role or Trip Role.
- **404 Not Found**: Resource doesn't exist or is not authorized to be seen.
- **422 Unprocessable Entity**: Invalid Pydantic payload.
- **500 Internal Server Error**: Backend failure.

## Note on Ownership
Never accept `owner_id` or similar from the frontend. The backend ALWAYS derives the user ID from the `current_user` authenticated token.
