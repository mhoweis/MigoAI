---
name: Supabase preview secret wiring
description: Replit preview behavior when a Prisma app uses a user-provided Supabase database
---

Use a dedicated secret for a user-provided Supabase PostgreSQL URI and reference that secret directly from Prisma. Do not rely on shell assignment through Replit's reserved `DATABASE_URL`; one-off migration workflows may not receive that remapping consistently.

**Why:** The backend workflow could start with the secure secret available, while Prisma migration workflows failed when `DATABASE_URL` was populated indirectly.

**How to apply:** Keep the Prisma datasource and backend environment validation aligned on the dedicated Supabase secret, and run migrations through a managed workflow so the secret is injected without exposing its value.