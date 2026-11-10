"use client";
import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import type { MatchResult } from "@/lib/jobs/match-types";

const TONE: Record<MatchResult["verdict"], { label: string; cls: string }> = {
  strong: { label: "Strong match", cls: "text-success border-success/40" },
  good: { label: "Good match", cls: "text-success border-success/40" },
  partial: { label: "Partial match", cls: "text-warn border-warn/40" },
  weak: { label: "Weak match", cls: "text-danger border-danger/40" },
};

export function MatchPanel({ jobId, initial, canMatch }: { jobId: string; initial: MatchResult | null; canMatch: boolean }) {
  const [match, setMatch] = useState<MatchResult | null>(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState(Boolean(initial));

  async function run(force: boolean) {
    setBusy(true); setErr(null); setOpen(true);
    const res = await fetch("/api/jobs/match", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jobId, force }) });
    const r = (await res.json().catch(() => ({ ok: false, message: "Something went wrong." }))) as { ok: boolean; message?: string; match?: MatchResult };
    setBusy(false);
    if (!r.ok || !r.match) return setErr(r.message ?? "Could not analyse this job.");
    setMatch(r.match);
  }

  if (!canMatch) return null;
  const tone = match ? TONE[match.verdict] : null;
  return (
    <div className="space-y-3">
      {!match && !busy && (
        <button type="button" onClick={() => run(false)} className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary hover:bg-primary/20">
          <Sparkles size={14} />Why this fits? (AI match)
        </button>
      )}
      {busy && <p className="inline-flex items-center gap-2 text-sm text-muted"><Loader2 size={14} className="animate-spin" />Comparing your CV with this job…</p>}
      {err && <p role="alert" className="text-sm text-danger">{err} <button type="button" className="underline" onClick={() => run(false)}>Try again</button></p>}
      {match && tone && open && (
        <div className="space-y-3 rounded-xl border border-border bg-bg/40 p-4 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${tone.cls}`}>{match.score}/100 · {tone.label}</span>
            <span className="text-xs text-muted">AI estimate based on your CV and this posting. Verify before applying.</span>
          </div>
          <p>{match.summary}</p>
          {match.strengths.length > 0 && <div><p className="font-semibold text-success">Where you fit</p><ul className="mt-1 list-disc space-y-1 pl-5 text-muted">{match.strengths.map((x) => <li key={x}>{x}</li>)}</ul></div>}
          {match.gaps.length > 0 && <div><p className="font-semibold text-warn">Gaps to know about</p><ul className="mt-1 list-disc space-y-1 pl-5 text-muted">{match.gaps.map((x) => <li key={x}>{x}</li>)}</ul></div>}
          {match.missingSkills.length > 0 && <div className="flex flex-wrap items-center gap-1.5"><span className="font-semibold">Skills to add:</span>{match.missingSkills.map((x) => <span key={x} className="rounded-full border border-border px-2 py-0.5 text-xs">{x}</span>)}</div>}
          {match.tips.length > 0 && <div><p className="font-semibold">When you apply</p><ul className="mt-1 list-disc space-y-1 pl-5 text-muted">{match.tips.map((x) => <li key={x}>{x}</li>)}</ul></div>}
          <div className="flex gap-4 text-xs">
            <button type="button" disabled={busy} onClick={() => run(true)} className="text-primary hover:underline">Re-analyse</button>
            <button type="button" onClick={() => setOpen(false)} className="text-muted hover:text-fg">Hide</button>
          </div>
        </div>
      )}
      {match && !open && <button type="button" onClick={() => setOpen(true)} className="text-sm text-primary hover:underline">Show AI match ({match.score}/100)</button>}
    </div>
  );
}
