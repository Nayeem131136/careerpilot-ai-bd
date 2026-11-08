# CareerPilot AI

AI career companion: upload a CV, discover careers and jobs worldwide (including Bangladesh), see explained matches, and get application **drafts**. The app never applies or emails on your behalf; you always send applications yourself.

Stack: Next.js 16 (App Router), React 19, TypeScript, Tailwind 4, Better Auth, Drizzle ORM, Neon Postgres, React Three Fiber.

## Local development
```bash
npm install
cp .env.example .env.local   # optional: without DATABASE_URL, an embedded local Postgres (PGlite, in .data/) is used
npm run dev
```
Open http://localhost:3000. Any non-Neon `DATABASE_URL` (e.g. a local Postgres) is supported via the standard driver. Admin: set `ADMIN_EMAILS` and `MASTER_ENCRYPTION_SECRET`, then visit `/admin/ai`. Health check: `/api/health`.

## Scripts
`npm run typecheck` · `npm run lint` · `npm run build` · `npm run db:generate` · `npm run db:migrate` (Neon) · `npm run db:studio`

## Docs
- `DEPLOY.md`: deploy to Vercel step by step
- `docs/ARCHITECTURE.md`: structure and decisions
- `docs/PROGRESS.md`: what is done and what comes next
- `docs/SPEC.md`: full product spec
