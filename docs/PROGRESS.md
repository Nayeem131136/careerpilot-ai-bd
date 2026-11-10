# Progress

Done
- Phase 0-1: scaffold, brand + 3D landing, public pages, auth, DB schema + migrations, dashboard shell, health endpoint, data export, account deletion.
- Phase 2: AI Control Center at /admin/ai. Admin by ADMIN_EMAILS. Providers: Gemini, Groq, OpenRouter, Mistral, Cerebras, OpenAI, Anthropic, DeepSeek, xAI, Together, Custom OpenAI-compatible. Keys encrypted (AES-256-GCM), write-only. Test connection, primary/fallback, per-task routing, per-user daily limit, usage + errors, audit log. All AI goes through src/lib/ai/service.ts `generate()`.

- Phase 3: onboarding (/dashboard/onboarding), CV upload/paste (PDF, DOCX, TXT, up to 4 MB, English/Bengali) at /dashboard/cv, AI analysis (task cv_analysis) validated with Zod, review and correct screen. Only extracted text is stored, not the file. Dashboard steps and AI status reflect real state (Ready only after a passing connection test).

- Phase 4: jobs feed (/dashboard/jobs): Jobicy, Arbeitnow, optional Adzuna and Jooble, Greenhouse/Lever company registry (/admin/sources), pasted circulars (Bengali/English) read by AI, TTL-cached ingest, dedupe, explainable relevance ranking, save/hide, coverage panel, daily cron. AI-written match scores come in Phase 5.

- Phase 4b (Bangladesh): sector and work-mode filters, add-by-link and pasted circulars, official notice pages/RSS registry with robots.txt checks and an SSRF-safe fetcher.

- Phase 5: AI match explanations per job (score, strengths, gaps, missing skills, tips), cached per user and CV version.

- Phase 6: application tracker and AI draft writer (cover letter / email, English or Bangla). Drafts are never sent.

- Phase 8: skill gaps from AI job matches and an AI learning roadmap with saved progress.

- Phase 7: admin overview, user management (suspend, delete), public job moderation, audit trail.

- Phase 9: hardening (HSTS and CSP headers, error and 404 pages, loading state, robots and sitemap), accurate privacy and terms text with env-driven operator details, complete data export, real dashboard data, mobile overflow fixes.

All planned phases are built.

Next: Phase 5 matching; Phase 6 drafts + tracker; Phase 7 admin tools/moderation; Phase 8 roadmap; Phase 9 hardening.
