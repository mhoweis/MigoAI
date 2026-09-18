# Migo on Replit

## Run the app

Use the **Run** button or start the `Start application` workflow. It runs:

```bash
npm run web:replit --workspace=@migo/mobile
```

The Expo web preview listens on port 5000.

## Project layout

- `apps/mobile`: Expo / React Native client
- `apps/backend`: Express / Prisma API
- `packages/shared`: shared TypeScript types, schemas, and constants

## Backend prerequisites

The Project workflow starts both the Expo web client and the Express API. Authentication and live event data require the API's Supabase PostgreSQL database plus `JWT_SECRET` and `JWT_REFRESH_SECRET` in Replit Secrets. Redis and third-party API credentials are optional.

The Prisma schema uses the PostgreSQL provider and reads the Supabase connection from the `SUPABASE_DATABASE_URL` secret. The original MySQL schema and migrations are retained under `apps/backend/prisma/migrations-mysql` for reference.

The API listens on port 5001 and the Expo web preview listens on port 5000. The preview injects its proxied API URL through `EXPO_PUBLIC_API_URL`.