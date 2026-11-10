"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import { HOURS, itemKeys, type Roadmap } from "@/lib/roadmap/schema";

type Saved = { roadmap: Roadmap; progress: Record<string, boolean>; targetRole: string; hoursPerWeek: number };
const input = "w-full rounded-xl border border-border bg-bg/60 px-3 py-2.5 text-sm outline-none focus:border-primary";
const OTHER = "__other";

async function call(method: string, body?: unknown) {
  const res = await fetch("/api/roadmap", { method, headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  return (await res.json().catch(() => ({ ok: false, message: "Something went wrong." }))) as { ok: boolean; message?: string };
}

function Check({ id, label, done, onToggle }: { id: string; label: string; done: boolean; onToggle: (id: string, v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-sm">
      <input type="checkbox" checked={done} onChange={(e) => onToggle(id, e.target.checked)} className="mt-1 size-4 shrink-0 accent-[var(--primary)]" />
      <span className={done ? "text-muted line-through" : ""}>{label}</span>
    </label>
  );
}

export function RoadmapView({ skills, gaps, analysed, roles, stale, saved }: { skills: string[]; gaps: { skill: string; jobs: number }[]; analysed: number; roles: string[]; stale: boolean; saved: Saved | null }) {
  const router = useRouter();
  const [progress, setProgress] = useState<Record<string, boolean>>(saved?.progress ?? {});
  const [role, setRole] = useState(saved && roles.includes(saved.targetRole) ? saved.targetRole : roles[0] ?? OTHER);
  const [custom, setCustom] = useState(saved && !roles.includes(saved.targetRole) ? saved.targetRole : "");
  const [hours, setHours] = useState<number>(saved?.hoursPerWeek ?? 10);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [editing, setEditing] = useState(!saved);

  const targetRole = role === OTHER ? custom.trim() : role;
  async function build() {
    if (saved && !confirm("Build a new roadmap? Your ticked items will be reset.")) return;
    setBusy(true); setErr(null);
    const r = await call("POST", { targetRole, hoursPerWeek: hours });
    setBusy(false);
    if (!r.ok) return setErr(r.message ?? "Could not build the roadmap.");
    setEditing(false); setProgress({}); router.refresh();
  }
  async function toggle(key: string, done: boolean) {
    setProgress((p) => { const n = { ...p }; if (done) n[key] = true; else delete n[key]; return n; });
    const r = await call("PATCH", { key, done });
    if (!r.ok) setProgress((p) => { const n = { ...p }; if (done) delete n[key]; else n[key] = true; return n; });
  }

  const keys = saved ? itemKeys(saved.roadmap) : [];
  const doneCount = keys.filter((k) => progress[k]).length;
  const pct = keys.length ? Math.round((doneCount / keys.length) * 100) : 0;
  const maxJobs = gaps[0]?.jobs ?? 1;

  return (
    <div className="space-y-6">
      <Card className="space-y-3">
        <h2 className="font-display text-lg font-bold">Your skills (from your CV)</h2>
        <div className="flex flex-wrap gap-1.5">{skills.length ? skills.map((s) => <span key={s} className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-xs">{s}</span>) : <p className="text-sm text-muted">No skills found in your CV.</p>}</div>
        <p className="text-xs text-muted">Wrong or missing skills? Fix them in <Link href="/dashboard/cv" className="text-primary hover:underline">My CV</Link>.</p>
      </Card>

      <Card className="space-y-3">
        <h2 className="font-display text-lg font-bold">Skill gaps from jobs you analysed</h2>
        {gaps.length === 0 ? (
          <p className="text-sm text-muted">{analysed === 0 ? "No jobs analysed yet. On the Jobs page, press “Why this fits? (AI match)” on a few jobs you like. The skills they ask for that your CV lacks will appear here." : "The jobs you analysed did not point out missing skills. Analyse a few more jobs for a clearer picture."}</p>
        ) : (
          <>
            <p className="text-sm text-muted">Based on {analysed} job{analysed === 1 ? "" : "s"} you analysed. Longer bar means more of those jobs asked for it.</p>
            <ul className="space-y-2">
              {gaps.map((g) => (
                <li key={g.skill} className="flex items-center gap-3 text-sm">
                  <span className="w-40 shrink-0 truncate sm:w-56">{g.skill}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-border/60"><span className="block h-full rounded-full bg-warn" style={{ width: `${Math.max(8, (g.jobs / maxJobs) * 100)}%` }} /></span>
                  <span className="w-16 shrink-0 text-right text-xs text-muted">{g.jobs} job{g.jobs === 1 ? "" : "s"}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      {(editing || !saved) ? (
        <Card className="space-y-4">
          <h2 className="font-display text-lg font-bold">{saved ? "Build a new roadmap" : "Build your roadmap"}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium">Target role
              <select value={role} onChange={(e) => setRole(e.target.value)} className={input}>
                {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                <option value={OTHER}>Another role…</option>
              </select>
            </label>
            <label className="space-y-1.5 text-sm font-medium">Time you can give each week
              <select value={hours} onChange={(e) => setHours(Number(e.target.value))} className={input}>{HOURS.map((h) => <option key={h} value={h}>{h} hours</option>)}</select>
            </label>
          </div>
          {role === OTHER && <input aria-label="Your target role" value={custom} onChange={(e) => setCustom(e.target.value)} maxLength={100} placeholder="e.g. Data Analyst, Accounts Officer, Graphic Designer" className={input} />}
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={build} disabled={busy || targetRole.length < 2}>{busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}{busy ? "Building (up to a minute)…" : "Build roadmap"}</Button>
            {saved && <button type="button" onClick={() => setEditing(false)} className="text-sm text-muted hover:text-fg">Cancel</button>}
          </div>
          {err && <p role="alert" className="text-sm text-danger">{err}</p>}
        </Card>
      ) : saved && (
        <>
          <Card className="space-y-3">
            <div className="flex flex-wrap items-start gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-lg font-bold">Roadmap: {saved.roadmap.targetRole}</h2>
                <p className="text-xs text-muted">About {saved.roadmap.totalWeeks} weeks at {saved.hoursPerWeek} hours a week</p>
              </div>
              <button type="button" onClick={() => setEditing(true)} className="text-sm text-primary hover:underline">Build a new one</button>
            </div>
            <p className="text-sm">{saved.roadmap.summary}</p>
            <div className="flex items-center gap-3"><span className="h-2 flex-1 overflow-hidden rounded-full bg-border/60"><span className="block h-full rounded-full bg-success" style={{ width: `${pct}%` }} /></span><span className="text-xs text-muted">{doneCount}/{keys.length} done</span></div>
            {stale && <p className="text-xs text-warn">Your CV changed after this roadmap was built. Build a new one to include the changes.</p>}
            {saved.roadmap.honestNote && <p className="text-xs text-muted">{saved.roadmap.honestNote}</p>}
          </Card>

          {saved.roadmap.quickWins.length > 0 && (
            <Card className="space-y-3"><h3 className="font-display font-bold">Quick wins this week</h3>
              <div className="space-y-2">{saved.roadmap.quickWins.map((q, i) => <Check key={i} id={`q-${i}`} label={q} done={Boolean(progress[`q-${i}`])} onToggle={toggle} />)}</div>
            </Card>
          )}

          {saved.roadmap.phases.map((ph, i) => (
            <Card key={i} className="space-y-3">
              <div><p className="text-xs font-semibold uppercase tracking-wide text-primary">{ph.weeks}</p><h3 className="font-display text-base font-bold">{ph.title}</h3><p className="text-sm text-muted">{ph.goal}</p></div>
              {ph.skills.length > 0 && <div className="flex flex-wrap gap-1.5">{ph.skills.map((s) => <span key={s} className="rounded-full border border-border px-2 py-0.5 text-xs">{s}</span>)}</div>}
              <div className="space-y-2">{ph.actions.map((a, j) => <Check key={j} id={`a-${i}-${j}`} label={a} done={Boolean(progress[`a-${i}-${j}`])} onToggle={toggle} />)}</div>
              {ph.resources.length > 0 && (
                <div><p className="text-sm font-semibold">Where to learn</p>
                  <ul className="mt-1 space-y-1 text-sm text-muted">{ph.resources.map((r, k) => (
                    <li key={k}>{r.name} <span className="text-xs">({r.kind})</span>{r.searchQuery && <> · <a href={`https://www.google.com/search?q=${encodeURIComponent(r.searchQuery)}`} target="_blank" rel="noopener noreferrer nofollow" className="text-primary hover:underline">Search</a></>}</li>
                  ))}</ul>
                </div>
              )}
            </Card>
          ))}

          {saved.roadmap.projectIdeas.length > 0 && (
            <Card className="space-y-3"><h3 className="font-display font-bold">Project ideas for your portfolio</h3>
              <div className="space-y-3">{saved.roadmap.projectIdeas.map((p, i) => (
                <div key={i} className="space-y-1"><Check id={`p-${i}`} label={p.title} done={Boolean(progress[`p-${i}`])} onToggle={toggle} />
                  <p className="pl-6 text-sm text-muted">{p.description}</p>
                  {p.skills.length > 0 && <div className="flex flex-wrap gap-1.5 pl-6">{p.skills.map((s) => <span key={s} className="rounded-full border border-border px-2 py-0.5 text-xs">{s}</span>)}</div>}
                </div>
              ))}</div>
            </Card>
          )}
          <p className="text-xs text-muted">The plan is an AI suggestion. Resource names are well-known starting points, not guarantees: check each one yourself. Nothing here promises a job.</p>
        </>
      )}
    </div>
  );
}
