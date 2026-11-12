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

## Phase 4 (jobs)
1. `npm install` then `npm run db:migrate` (adds `jobs`, `job_fetch_log`, `company_sources`, `user_job_state`, migration `0003_jobs`).
2. Optional env vars: `CRON_SECRET` (16+ random chars; enables the daily refresh in `vercel.json`), `ADZUNA_APP_ID` + `ADZUNA_APP_KEY` (developer.adzuna.com), `JOOBLE_API_KEY` (jooble.org/api/about). Jobicy and Arbeitnow work without keys.
3. Redeploy, open `/dashboard/jobs`, press "Refresh jobs". Admin: `/admin/sources` shows source status and lets you add Greenhouse/Lever company boards.
4. Respect source terms: Jobicy asks for few checks per day (results are cached 6 hours); Remotive is intentionally not used.

## Bangladesh jobs (Phase 4b)
1. `npm run db:migrate` (migration `0004_bd_filters`: sector, work mode, deadline, `page_sources`).
2. Job feed filters: Government/Private/NGO and Onsite/Hybrid/Remote/Work-from-home.
3. Users can add any job by link (we fetch the public page and read it with AI) or by pasting a circular.
4. Admin: `/admin/sources` > "Official notice pages and RSS feeds". Add an https page or RSS feed that publishes job circulars. We check robots.txt before adding and reading, read each page at most twice a day, and link back to the original. Pages that need JavaScript/login cannot be read; prefer RSS.
5. We do not scrape Bdjobs, Facebook or LinkedIn (their terms forbid it). For Bdjobs, request an official API/partnership by email.

Note: only the admin can add jobs by link or pasted circular; they are published to all users as "Added by CareerPilot". Users cannot add jobs. No new migration.

## Phase 5: AI match explanations
1. `npm install` then `npm run db:migrate` (migration `0005_job_matches`).
2. No new environment variables. It uses the AI provider set in the admin panel (task "job_match", which can be routed to its own model).
3. On the Jobs page each job has a "Why this fits? (AI match)" button. It compares the user's reviewed CV with the posting and shows a score, strengths, gaps, skills to add and tips. Results are saved and reused until the CV changes. The "quick fit" badge is the fast keyword score used for ordering.
4. It counts against the per-user daily AI limit (Admin > AI).

## Phase 6: application drafts and tracker
1. `npm install` then `npm run db:migrate` (migration `0006_applications`).
2. No new environment variables. Drafts use the AI provider from the admin panel (task "draft_writing").
3. On each job, "Prepare application" opens a workspace: status tracker, AI draft writer (cover letter or short email, English or Bangla, three tones), editable drafts with Copy and "Open in my email app", and private notes. The Applications page lists everything with status filters.
4. Nothing is ever sent by the site. The user copies the draft and applies personally.

## Phase 8: skills and roadmap
1. `npm install` then `npm run db:migrate` (migration `0007_roadmaps`).
2. No new environment variables. The roadmap uses the AI provider from the admin panel (task "roadmap").
3. The Skills & roadmap page shows the CV skills, the skill gaps found by the user's AI job matches (Phase 5) and an AI roadmap for a chosen target role and weekly hours, with a tickable checklist that saves progress. Resources are named with a search link, never an invented URL.

## Phase 7: admin tools
1. `npm install` then `npm run db:migrate` (migration `0008_user_banned`: adds `banned` to users).
2. No new environment variables.
3. Admin now has: Overview (users, CVs, applications, jobs, AI calls and failures by task, recent admin activity), Users (search, suspend/reactivate, delete account and all its data; admin accounts cannot be changed here), Jobs (search and remove public jobs). Suspending signs the person out everywhere and blocks them until reactivated. Every action is written to the audit log shown on the Overview.

## Phase 9: final checklist before you share the site
1. `npm install` then `npm run db:migrate` (no new migration in Phase 9; run it anyway, it only applies what is missing).
2. Vercel > Settings > Environment Variables. Required (already set): `DATABASE_URL` (Secret), `BETTER_AUTH_SECRET` (Secret), `MASTER_ENCRYPTION_SECRET` (Secret), `NEXT_PUBLIC_APP_URL` (Config), `ADMIN_EMAILS` (Config).
3. Add these Config variables so the Privacy and Terms pages show your real details (otherwise they show a draft notice): `LEGAL_OWNER_NAME`, `LEGAL_COUNTRY`, `LEGAL_CONTACT_EMAIL`. Then redeploy.
4. Optional Secrets: `JOOBLE_API_KEY`, `ADZUNA_APP_ID`, `ADZUNA_APP_KEY`, `CRON_SECRET`.
5. Admin > AI: pick a provider, load models, save, press Test connection until it says Connected. Set it as Primary.
6. Admin > Job sources: add official notice pages / RSS feeds and any company boards, press Refresh now.
7. Check as a normal user: sign up, onboarding, upload CV, review it, Jobs > Refresh jobs, "Why this fits?", "Prepare application", Skills & roadmap.
8. Have a lawyer review the Privacy Policy and Terms before a wide public launch. The age line (16 and over) and the liability wording are defaults you should confirm.

Security notes: headers include HSTS and a frame/base/form CSP; all state-changing routes check the Origin header and the session; every record is scoped to its owner; AI keys are encrypted and write-only; suspended accounts are blocked everywhere. `npm audit` reports moderate issues only in the `drizzle-kit` developer tool chain (esbuild dev server), which is not used at runtime.

## Speed tip (important)
Every page reads the database, so the distance between Vercel and Neon matters. In Neon (Project > Settings) note the region. In Vercel > Settings > Functions set "Function Region" to the closest one (for example Singapore `sin1` if Neon is in AWS Singapore, or Washington `iad1` if Neon is in US East). A mismatch adds hundreds of milliseconds to every click. Redeploy after changing it.


## Scholarships (migration 0009)

1. Run the migration (Windows CMD): `set "DATABASE_URL=your-neon-url"` then `npm run db:migrate`.
2. Admin → Scholarships → **Add by hand** has a box at the top: paste one scholarship's details (lines like `Name: …`, `Funding: …`, `Official link: …`) and press **Fill form**; it fills every field and cleans the link. Or use **Add from an official page** (paste an official link; AI fills the form) or **Add by hand**. Everything goes to the review queue; check each field against the official page, press **Mark verified**, then **Publish**.
3. Every Monday a cron re-checks published official pages and flags **Page changed** / **Link broken**. It never edits content.

## Deadline reminders (no migration, no new env variables)
Users get a **Deadlines** page (sidebar) and an "Upcoming deadlines" card on the dashboard. It lists jobs they are preparing (status Interested/Drafting) and scholarships they saved, closest first, with Passed / Next 7 days / Later / No date found. Each application has a **Your deadline** date picker. **Add to my calendar (.ics)** downloads a calendar file; the user's own calendar app then reminds them 7 days and 1 day before. There is no email sending (that would need an email provider); it can be added later.

## Closed jobs
Jobs whose deadline (read from the deadline text) has passed are hidden from the feed; users can tick "Show closed jobs"; jobs a user saved always stay visible with a "Closed" tag. The daily refresh deletes public jobs closed more than 30 days ago. No migration.
