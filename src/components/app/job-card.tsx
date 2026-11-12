"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bookmark, EyeOff, ExternalLink } from "lucide-react";
import { Badge, Card } from "@/components/ui/primitives";
import { SOURCE_LABELS } from "@/lib/jobs/types";
import type { MatchResult } from "@/lib/jobs/match-types";
import { MatchPanel } from "./match-panel";

export type JobView = {
  id: string; title: string; company: string; location: string | null; country: string | null; remote: boolean | null; jobType: string | null;
  description: string; url: string; source: string; postedAt: string | null; saved: boolean; salary: string | null;
  sector: string | null; workMode: string | null; deadline: string | null; score: number | null; daysLeft: number | null; expired: boolean; matchedSkills: string[]; notes: string[];
  ai: MatchResult | null; canMatch: boolean;
};

function ago(iso: string | null) {
  if (!iso) return null;
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 864e5);
  return d <= 0 ? "today" : d === 1 ? "1 day ago" : `${d} days ago`;
}

export function JobCard({ job }: { job: JobView }) {
  const [saved, setSaved] = useState(job.saved);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [preparing, setPreparing] = useState(false);
  const src = SOURCE_LABELS[job.source];
  async function setState(state: "saved" | "hidden" | null) {
    const res = await fetch("/api/jobs/state", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jobId: job.id, state }) });
    if (!res.ok) return;
    if (state === "hidden") setHidden(true); else setSaved(state === "saved");
  }
  async function prepare() {
    setPreparing(true);
    const res = await fetch("/api/applications", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jobId: job.id }) });
    const r = (await res.json().catch(() => null)) as { ok: boolean; id?: string } | null;
    if (r?.ok && r.id) router.push(`/dashboard/applications/${r.id}`); else setPreparing(false);
  }
  if (hidden) return null;
  const tone = job.score == null ? null : job.score >= 60 ? "success" : job.score >= 35 ? "warn" : "default";
  return (
    <Card className="space-y-3">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base font-bold leading-snug">{job.title}</h3>
          <p className="text-sm text-muted">{job.company}{job.location ? ` · ${job.location}` : ""}{ago(job.postedAt) ? ` · ${ago(job.postedAt)}` : ""}</p>
        </div>
        {job.score != null && <Badge tone={tone ?? "default"}>{job.score}% quick fit</Badge>}
      </div>
      <div className="flex flex-wrap gap-1.5 text-xs">
        {job.sector && job.sector !== "private" && <span className="rounded-full border border-cyan/40 bg-cyan/10 px-2 py-0.5">{job.sector === "government" ? "Government" : "NGO"}</span>}
        {job.workMode ? <span className="rounded-full border border-border px-2 py-0.5">{{ onsite: "Onsite", hybrid: "Hybrid", remote: "Remote", home: "Work from home" }[job.workMode] ?? job.workMode}</span> : job.remote && <span className="rounded-full border border-border px-2 py-0.5">Remote</span>}
        {job.expired && <span className="rounded-full border border-danger/50 bg-danger/10 px-2 py-0.5 text-danger">Closed: the deadline has passed</span>}
        {!job.expired && job.daysLeft !== null && job.daysLeft <= 7 && <span className="rounded-full border border-warn/50 bg-warn/10 px-2 py-0.5 text-warn">{job.daysLeft === 0 ? "Closes today" : job.daysLeft === 1 ? "Closes tomorrow" : `Closes in ${job.daysLeft} days`}</span>}
        {job.deadline && <span className="rounded-full border border-warn/40 px-2 py-0.5">Deadline: {job.deadline}</span>}
        {job.jobType && <span className="rounded-full border border-border px-2 py-0.5">{job.jobType}</span>}
        {job.salary && <span className="rounded-full border border-border px-2 py-0.5">{job.salary}</span>}
        {job.matchedSkills.slice(0, 6).map((s) => <span key={s} className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5">{s}</span>)}
      </div>
      {job.notes.length > 0 && <p className="text-xs text-muted">{job.notes.join(" · ")}</p>}
      <MatchPanel jobId={job.id} initial={job.ai} canMatch={job.canMatch} />
      {open && <p className="whitespace-pre-line text-sm text-muted">{job.description.slice(0, 1800)}{job.description.length > 1800 ? "…" : ""}</p>}
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <button type="button" onClick={() => setOpen((v) => !v)} className="text-primary hover:underline">{open ? "Hide details" : "Details"}</button>
        {((job.source !== "pasted" && job.source !== "curated") || !job.url.endsWith("/dashboard/jobs")) && <a href={job.url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 text-primary hover:underline">View original <ExternalLink size={12} /></a>}
        <button type="button" onClick={prepare} disabled={preparing} className="font-semibold text-primary hover:underline disabled:opacity-60">{preparing ? "Opening…" : "Prepare application"}</button>
        <button type="button" onClick={() => setState(saved ? null : "saved")} aria-pressed={saved} className={`inline-flex items-center gap-1 ${saved ? "text-fg" : "text-muted hover:text-fg"}`}><Bookmark size={14} fill={saved ? "currentColor" : "none"} />{saved ? "Saved" : "Save"}</button>
        <button type="button" onClick={() => setState("hidden")} className="inline-flex items-center gap-1 text-muted hover:text-fg"><EyeOff size={14} />Hide</button>
        <span className="ml-auto text-xs text-muted">{src?.url ? <a href={src.url} target="_blank" rel="noopener noreferrer nofollow" className="hover:underline">via {src.label}</a> : src?.label}</span>
      </div>
    </Card>
  );
}
