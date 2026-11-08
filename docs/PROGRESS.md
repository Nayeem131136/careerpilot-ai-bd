# Progress

Done
- Phase 0-1: scaffold, brand + 3D landing, public pages, auth, DB schema + migrations, dashboard shell, health endpoint, data export, account deletion.
- Phase 2: AI Control Center at /admin/ai. Admin by ADMIN_EMAILS. Providers: Gemini, Groq, OpenRouter, Mistral, Cerebras, OpenAI, Anthropic, DeepSeek, xAI, Together, Custom OpenAI-compatible. Keys encrypted (AES-256-GCM), write-only. Test connection, primary/fallback, per-task routing, per-user daily limit, usage + errors, audit log. All AI goes through src/lib/ai/service.ts `generate()`.

- Phase 3: onboarding (/dashboard/onboarding), CV upload/paste (PDF, DOCX, TXT, up to 4 MB, English/Bengali) at /dashboard/cv, AI analysis (task cv_analysis) validated with Zod, review and correct screen. Only extracted text is stored, not the file. Dashboard steps and AI status reflect real state (Ready only after a passing connection test).

Next: Phase 4 job sources + Smart Feed; Phase 5 matching; Phase 6 drafts + tracker; Phase 7 admin tools/moderation; Phase 8 roadmap; Phase 9 hardening.
