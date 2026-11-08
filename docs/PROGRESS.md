# Progress

Done
- Phase 0-1: scaffold, brand + 3D landing, public pages, auth, DB schema + migrations, dashboard shell, health endpoint, data export, account deletion.
- Phase 2: AI Control Center at /admin/ai. Admin by ADMIN_EMAILS. Providers: Gemini, Groq, OpenRouter, Mistral, Cerebras, OpenAI, Anthropic, DeepSeek, xAI, Together, Custom OpenAI-compatible. Keys encrypted (AES-256-GCM), write-only. Test connection, primary/fallback, per-task routing, per-user daily limit, usage + errors, audit log. All AI goes through src/lib/ai/service.ts `generate()`.

Next: Phase 3 onboarding + CV upload/parse (Blob, English/Bengali); Phase 4 job sources + Smart Feed; Phase 5 matching; Phase 6 drafts + tracker; Phase 7 admin tools/moderation; Phase 8 roadmap; Phase 9 hardening.
