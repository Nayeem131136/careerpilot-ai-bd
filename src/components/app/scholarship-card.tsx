"use client";
import { useState } from "react";
import { Bookmark, BookmarkCheck, ExternalLink } from "lucide-react";
import { Badge, Card } from "@/components/ui/primitives";
import type { CardData } from "@/lib/scholarships/view";

export function ScholarshipCard({ s, saved: initial }: { s: CardData; saved: boolean }) {
  const [saved, setSaved] = useState(initial);
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState(false);

  async function toggle() {
    const next = !saved; setSaved(next); setErr(false);
    const res = await fetch("/api/scholarships/save", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: s.id, saved: next }) }).catch(() => null);
    if (!res || !res.ok) { setSaved(!next); setErr(true); }
  }
  const row = (label: string, v: string) => v ? <div><dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt><dd className="mt-0.5 text-sm">{v}</dd></div> : null;

  return (
    <Card className="space-y-3 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg font-bold leading-snug">{s.name}</h3>
          <p className="text-sm text-muted">{s.provider}</p>
        </div>
        <button type="button" onClick={toggle} aria-pressed={saved} aria-label={saved ? "Remove from saved" : "Save scholarship"} className={`shrink-0 rounded-lg p-2 ${saved ? "text-primary" : "text-muted hover:text-fg"}`}>{saved ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}</button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Badge tone={s.funding === "full" ? "success" : "warn"}>{s.funding === "full" ? "Fully funded" : "Partial funding"}</Badge>
        {s.levels.map((l) => <Badge key={l}>{l}</Badge>)}
        <Badge tone={s.bangladeshEligible === "yes" ? "success" : "default"}>{s.bangladeshEligible === "yes" ? "Open to Bangladeshis" : "Check Bangladesh eligibility"}</Badge>
      </div>
      {s.universities.length > 0 && <p className="text-sm text-muted">{s.universities.slice(0, 6).join(" · ")}{s.universities.length > 6 ? ` · +${s.universities.length - 6} more` : ""}</p>}
      <p className="text-sm">{s.coverage}</p>
      <p className="text-sm"><span className="text-muted">Deadline: </span><span className={s.deadlineState === "passed" ? "text-warn" : ""}>{s.deadline || "Check the official page"}</span></p>
      {open && (
        <dl className="grid gap-3 border-t border-border pt-3 sm:grid-cols-2">
          {row("Who can apply", s.eligibility)}{row("Language", s.language)}{row("How to apply", s.howToApply)}{row("Fields", s.fields.join(", ") || "All fields")}
        </dl>
      )}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <a href={s.officialUrl} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">Official page <ExternalLink size={14} /></a>
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="text-sm text-muted hover:text-fg">{open ? "Hide details" : "Details"}</button>
        <span className={`text-xs ${s.verified === "fresh" ? "text-success" : "text-warn"}`}>
          {s.verified === "fresh" ? `Checked by us ${s.verifiedOn}` : s.verified === "stale" ? `Last checked ${s.verifiedOn}: confirm on the official page` : "Not yet checked by us: confirm on the official page"}
        </span>
        {s.flagged && <span className="text-xs text-warn">{s.flagged === "changed" ? "The official page changed recently: re-check the details there" : "We could not reach the official page on our last check"}</span>}
      </div>
      {err && <p role="alert" className="text-xs text-danger">Could not save. Please try again.</p>}
    </Card>
  );
}
