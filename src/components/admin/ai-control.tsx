"use client";
import { useState, useTransition } from "react";
import { CheckCircle2, ExternalLink, KeyRound, Trash2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, Card, Input } from "@/components/ui/primitives";
import { loadModels, removeProvider, saveProvider, saveSettings, testConnection } from "@/app/admin/ai/actions";

type Cat = { key: string; label: string; tier: "free" | "free-tier" | "paid"; defaultModel: string; note: string; keyUrl?: string; custom: boolean };
type Prov = { id: string; providerKey: string; label: string; keyLast4: string; baseUrl: string | null; model: string; enabled: boolean; lastTestAt: string | null; lastTestOk: boolean | null; lastTestMsg: string | null };
type Settings = { primaryProviderId: string | null; fallbackProviderId: string | null; dailyUserLimit: number; routing: Record<string, { providerId?: string; model?: string }> };

const tierLabel = { free: "Free", "free-tier": "Free tier", paid: "Paid" } as const;
const selectCls = "w-full rounded-xl border border-border bg-bg/60 px-3 py-2.5 text-sm outline-none focus:border-primary";

export function AiControl({ catalogue, tasks, providers, settings, encryptionReady }: { catalogue: Cat[]; tasks: { key: string; label: string }[]; providers: Prov[]; settings: Settings; encryptionReady: boolean }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [choice, setChoice] = useState(catalogue[0].key);
  const [form, setForm] = useState({ apiKey: "", model: catalogue[0].defaultModel, baseUrl: "" });
  const [s, setS] = useState(settings);
  const [models, setModels] = useState<string[]>([]);

  const cat = catalogue.find((c) => c.key === choice)!;
  const existing = providers.find((p) => p.providerKey === choice);
  const report = (r: { ok: boolean; message: string }) => setMsg({ ok: r.ok, text: r.message });

  function pick(key: string) {
    const c = catalogue.find((x) => x.key === key)!;
    const e = providers.find((p) => p.providerKey === key);
    setChoice(key);
    setForm({ apiKey: "", model: e?.model ?? c.defaultModel, baseUrl: e?.baseUrl ?? "" });
    setMsg(null);
    setModels([]);
  }

  return (
    <div className="space-y-6">
      {msg && <p role="status" className={`rounded-xl border px-4 py-3 text-sm ${msg.ok ? "border-success/40 text-success" : "border-danger/40 text-danger"}`}>{msg.text}</p>}

      <Card>
        <h2 className="font-display text-lg font-bold">1. Connect a provider</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="prov" className="text-sm font-medium">Provider</label>
            <select id="prov" className={selectCls} value={choice} onChange={(e) => pick(e.target.value)}>
              {catalogue.map((c) => <option key={c.key} value={c.key}>{c.label} ({tierLabel[c.tier]}){providers.some((p) => p.providerKey === c.key) ? " ✓" : ""}</option>)}
            </select>
            <p className="text-xs text-muted">{cat.note} {cat.keyUrl && <a className="inline-flex items-center gap-1 text-primary hover:underline" href={cat.keyUrl} target="_blank" rel="noopener noreferrer">Get a key <ExternalLink size={11} /></a>}</p>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="model" className="text-sm font-medium">Model</label>
            <Input id="model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="model name" />
            {existing && (
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="secondary" className="px-3 py-1.5 text-xs" disabled={pending} onClick={() => start(async () => { const r = await loadModels(existing.id); report(r); setModels(r.models); })}>Load available models</Button>
                {models.length > 0 && (
                  <select aria-label="Available models" className={selectCls + " max-w-xs"} value={models.includes(form.model) ? form.model : ""} onChange={(e) => e.target.value && setForm({ ...form, model: e.target.value })}>
                    <option value="">Pick a model…</option>
                    {models.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                )}
              </div>
            )}
            <p className="text-xs text-muted">Editable. Use “Load available models” to see exactly what your key can use.</p>
          </div>
          {cat.custom && (
            <div className="space-y-1.5 md:col-span-2">
              <label htmlFor="base" className="text-sm font-medium">Base URL (https, public host)</label>
              <Input id="base" value={form.baseUrl} onChange={(e) => setForm({ ...form, baseUrl: e.target.value })} placeholder="https://api.example.com/v1" />
            </div>
          )}
          <div className="space-y-1.5 md:col-span-2">
            <label htmlFor="key" className="text-sm font-medium">API key {existing && <span className="font-normal text-muted">(saved: ••••{existing.keyLast4}; leave empty to keep)</span>}</label>
            <div className="relative">
              <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <Input id="key" type="password" autoComplete="off" className="pl-9" value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} placeholder={existing ? "Paste a new key to replace" : "Paste API key"} disabled={!encryptionReady} />
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button disabled={pending || !encryptionReady} onClick={() => start(async () => { report(await saveProvider({ providerKey: choice, apiKey: form.apiKey || undefined, baseUrl: form.baseUrl, model: form.model, enabled: existing?.enabled ?? true })); setForm((f) => ({ ...f, apiKey: "" })); })}>
            {pending ? "Saving…" : existing ? "Update provider" : "Save provider"}
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="font-display text-lg font-bold">Connected providers</h2>
        {providers.length === 0 ? <p className="mt-3 text-sm text-muted">None yet. Connect one above.</p> : (
          <ul className="mt-4 space-y-3">
            {providers.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{p.label} <span className="font-normal text-muted">· {p.model} · ••••{p.keyLast4}</span></p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                    {p.lastTestOk === null ? "Not tested yet" : p.lastTestOk ? <><CheckCircle2 size={13} className="text-success" />{p.lastTestMsg}</> : <><XCircle size={13} className="text-danger" />{p.lastTestMsg}</>}
                  </p>
                </div>
                {!p.enabled && <Badge tone="warn">Disabled</Badge>}
                <Button variant="secondary" disabled={pending} onClick={() => start(async () => report(await testConnection(p.id)))}>Test connection</Button>
                <Button variant="secondary" disabled={pending} onClick={() => start(async () => report(await saveProvider({ providerKey: p.providerKey, baseUrl: p.baseUrl ?? "", model: p.model, enabled: !p.enabled })))}>{p.enabled ? "Disable" : "Enable"}</Button>
                <Button variant="danger" aria-label={`Remove ${p.label}`} disabled={pending} onClick={() => { if (confirm(`Remove ${p.label} and its stored key?`)) start(async () => report(await removeProvider(p.id))); }}><Trash2 size={15} /></Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="font-display text-lg font-bold">2. Which provider runs the site</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="primary" className="text-sm font-medium">Primary provider</label>
            <select id="primary" className={selectCls} value={s.primaryProviderId ?? ""} onChange={(e) => setS({ ...s, primaryProviderId: e.target.value || null })}>
              <option value="">None (AI off)</option>
              {providers.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="fallback" className="text-sm font-medium">Fallback (used if primary fails)</label>
            <select id="fallback" className={selectCls} value={s.fallbackProviderId ?? ""} onChange={(e) => setS({ ...s, fallbackProviderId: e.target.value || null })}>
              <option value="">None</option>
              {providers.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="limit" className="text-sm font-medium">AI requests per user per day</label>
            <Input id="limit" type="number" min={1} max={10000} value={s.dailyUserLimit} onChange={(e) => setS({ ...s, dailyUserLimit: Number(e.target.value) || 1 })} />
          </div>
        </div>

        <h3 className="mt-6 text-sm font-semibold">Per-task routing (optional)</h3>
        <p className="text-xs text-muted">Send specific tasks to a different provider or model, for example a stronger model for drafts. Leave blank to use the primary.</p>
        <div className="mt-3 space-y-2">
          {tasks.map((t) => {
            const r = s.routing[t.key] ?? {};
            const set = (v: { providerId?: string; model?: string }) => setS({ ...s, routing: { ...s.routing, [t.key]: { ...r, ...v } } });
            return (
              <div key={t.key} className="grid items-center gap-2 md:grid-cols-[1fr_1fr_1fr]">
                <span className="text-sm">{t.label}</span>
                <select aria-label={`${t.label} provider`} className={selectCls} value={r.providerId ?? ""} onChange={(e) => set({ providerId: e.target.value || undefined })}>
                  <option value="">Primary</option>
                  {providers.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
                <Input aria-label={`${t.label} model`} placeholder="Model override" value={r.model ?? ""} onChange={(e) => set({ model: e.target.value || undefined })} />
              </div>
            );
          })}
        </div>
        <div className="mt-5">
          <Button disabled={pending} onClick={() => start(async () => report(await saveSettings(s)))}>{pending ? "Saving…" : "Save settings"}</Button>
        </div>
      </Card>
    </div>
  );
}
