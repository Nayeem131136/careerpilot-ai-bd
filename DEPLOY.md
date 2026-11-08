# Deploy to Vercel

1. Push this folder to a GitHub repo.
2. Create a free Neon Postgres database (neon.tech). Copy the **pooled** connection string.
3. Run migrations once from your machine:
   `DATABASE_URL="<neon url>" npm run db:migrate`
4. In Vercel: New Project, import the repo (framework: Next.js; Node 22).
5. Add environment variables (also `ADMIN_EMAILS` = your email, and `MASTER_ENCRYPTION_SECRET`, see below)
   Add environment variables (see `.env.example`). Required: `DATABASE_URL`, `BETTER_AUTH_SECRET` (`openssl rand -base64 32`), `NEXT_PUBLIC_APP_URL` (your Vercel URL). Optional: OAuth keys, `RESEND_API_KEY` + `EMAIL_FROM`.
6. Deploy a **Preview** first, open `/api/health` (should show `"database":"ok"`), then register, log in, and open the dashboard.
7. Promote to Production. Add your custom domain in Vercel if you have one, and update `NEXT_PUBLIC_APP_URL`.

Notes
- Without `RESEND_API_KEY`, email verification and password reset are disabled (the UI says so).
- Social login buttons appear only when their keys are set. OAuth callback: `<app url>/api/auth/callback/<provider>`.
- Never commit `.env*` files.

## Admin and AI (Phase 2)
1. Set `ADMIN_EMAILS` to your email (comma-separate for several). Register an account with that email first; on next sign-in it becomes admin and an "Admin" link appears in the sidebar.
2. Set `MASTER_ENCRYPTION_SECRET` (32+ random chars: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`). Keep it forever: changing it makes stored AI keys unreadable (re-enter them).
3. Redeploy, open `/admin/ai`, pick a provider, paste its API key, Save, then "Test connection". Choose it as Primary and Save settings.
4. New database tables are added by migration `0001_ai_control`: run `npm run db:migrate` with your Neon `DATABASE_URL` before using it.

## Phase 3 (onboarding + CV)
Run `npm install` and `npm run db:migrate` (adds the `cvs` table, migration `0002_cvs`) before deploying. No new environment variables are needed. Scanned/image-only PDFs cannot be read; users can paste their CV text instead.
