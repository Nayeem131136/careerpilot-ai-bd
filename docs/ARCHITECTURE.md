# Architecture

- `src/app/(marketing)`: public pages. `(auth)`: login/register/reset. `(app)/dashboard`: signed-in area. `api/`: auth, health, account export.
- `src/lib/env.ts`: Zod-validated env; builds succeed without secrets, runtime errors are explicit.
- `src/lib/db`: Drizzle. Neon serverless Pool in production; PGlite embedded Postgres for local dev only. Schema in `schema.ts`, migrations in `/drizzle`.
- `src/lib/auth.ts`: Better Auth (lazy), DB-backed rate limiting, role is server-only (`input:false`), social/email features gated by env.
- `src/lib/session.ts`: `getSession`, `requireSession`, `requireAdmin`. Dashboard access is gated in the dashboard layout via `requireSession`.
- `src/components/three`: lazy, client-only 3D (hero orb, scroll journey) with quality tiers, off-screen pause and a static fallback.
- Principles: drafts only (no auto-apply), honest empty states, no fake data, privacy-first (own-data export, account deletion).
