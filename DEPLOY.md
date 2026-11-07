# Deploy to Vercel

1. Push this folder to a GitHub repo.
2. Create a free Neon Postgres database (neon.tech). Copy the **pooled** connection string.
3. Run migrations once from your machine:
   `DATABASE_URL="<neon url>" npm run db:migrate`
4. In Vercel: New Project, import the repo (framework: Next.js; Node 22).
5. Add environment variables (see `.env.example`). Required: `DATABASE_URL`, `BETTER_AUTH_SECRET` (`openssl rand -base64 32`), `NEXT_PUBLIC_APP_URL` (your Vercel URL). Optional: OAuth keys, `RESEND_API_KEY` + `EMAIL_FROM`.
6. Deploy a **Preview** first, open `/api/health` (should show `"database":"ok"`), then register, log in, and open the dashboard.
7. Promote to Production. Add your custom domain in Vercel if you have one, and update `NEXT_PUBLIC_APP_URL`.

Notes
- Without `RESEND_API_KEY`, email verification and password reset are disabled (the UI says so).
- Social login buttons appear only when their keys are set. OAuth callback: `<app url>/api/auth/callback/<provider>`.
- Never commit `.env*` files.
