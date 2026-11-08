"use client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { FileText, Loader2, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, Card, Input } from "@/components/ui/primitives";
import { LEVEL_LABELS } from "@/lib/options";
import type { CvAnalysis } from "@/lib/cv/schema";

type Cv = { fileName: string | null; status: "pending" | "analyzed" | "failed"; error: string | null; reviewed: boolean; parsed: CvAnalysis | null };
const selectCls = "w-full rounded-xl border border-border bg-bg/60 px-3 py-2.5 text-sm outline-none focus:border-primary";

async function call(method: string, body?: BodyInit, headers?: HeadersInit) {
  const res = await fetch("/api/cv", { method, body, headers });
  const j = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string; error?: string };
  return { ok: Boolean(j.ok), message: j.message ?? j.error ?? (res.ok ? "" : "Something went wrong. Please try again.") };
}

function TagEditor({ label, values, onChange, max }: { label: string; values: string[]; onChange: (v: string[]) => void; max: number }) {
  const [draft, setDraft] = useState("");
  const add = () => { const t = draft.trim(); if (t && !values.includes(t) && values.length < max) onChange([...values, t.slice(0, 80)]); setDraft(""); };
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex flex-wrap gap-2">
        {values.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-xs">
            {v}<button type="button" aria-label={`Remove ${v}`} onClick={() => onChange(values.filter((x) => x !== v))} className="text-muted hover:text-danger"><X size={12} /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input aria-label={`Add to ${label}`} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} placeholder="Type and press Enter" />
        <Button type="button" variant="secondary" onClick={add}>Add</Button>
      </div>
    </div>
  );
}

export function CvManager({ cv, aiReady }: { cv: Cv | null; aiReady: boolean }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [paste, setPaste] = useState(false);
  const [text, setText] = useState("");
  const [replace, setReplace] = useState(false);
  // Local edits only; otherwise show what the server has (stays in sync after refresh).
  const [draft, setEdit] = useState<CvAnalysis | null>(null);
  const edit = draft ?? cv?.parsed ?? null;

  async function run(label: string, fn: () => Promise<{ ok: boolean; message: string }>, okText: string) {
    setBusy(label); setMsg(null);
    const r = await fn();
    setBusy(null);
    setEdit(null);
    setMsg({ ok: r.ok, text: r.ok ? okText : r.message });
    router.refresh();
    return r;
  }

  const upload = (file?: File) => {
    if (!file) return;
    const fd = new FormData(); fd.set("file", file);
    run("analyzing", () => call("POST", fd), "CV analysed. Please review the details below.").then(() => setReplace(false));
  };
  const submitPaste = () => {
    const fd = new FormData(); fd.set("text", text);
    run("analyzing", () => call("POST", fd), "CV analysed. Please review the details below.").then(() => { setReplace(false); setText(""); setPaste(false); });
  };

  const showUploader = !cv || replace;
  return (
    <div className="space-y-5">
      {!aiReady && <Card className="border-warn/50"><p className="text-sm"><span className="font-semibold text-warn">AI is not connected yet.</span> <span className="text-muted">You can still upload your CV; analysis will work once the site admin connects an AI provider.</span></p></Card>}
      {msg && <p role="status" className={`rounded-xl border px-4 py-3 text-sm ${msg.ok ? "border-success/40 text-success" : "border-danger/40 text-danger"}`}>{msg.text}</p>}

      {busy === "analyzing" && (
        <Card className="flex items-center gap-3"><Loader2 className="animate-spin text-cyan" size={20} /><p className="text-sm">Reading your CV… this can take up to a minute. Please keep this page open.</p></Card>
      )}

      {showUploader && busy !== "analyzing" && (
        <Card>
          <h2 className="font-display text-lg font-bold">{cv ? "Replace your CV" : "Upload your CV"}</h2>
          <p className="mt-1 text-sm text-muted">PDF, DOCX or TXT, up to 4 MB. English and Bengali are supported. Your file itself is not stored, only the text we read from it.</p>
          <input ref={fileRef} type="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" className="sr-only" id="cv-file" onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ""; }} />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" onClick={() => fileRef.current?.click()}><Upload size={16} />Choose a file</Button>
            <Button type="button" variant="secondary" onClick={() => setPaste((v) => !v)}>{paste ? "Hide text box" : "Paste text instead"}</Button>
            {cv && <Button type="button" variant="ghost" onClick={() => setReplace(false)}>Cancel</Button>}
          </div>
          {paste && (
            <div className="mt-4 space-y-3">
              <textarea aria-label="Paste your CV text" value={text} onChange={(e) => setText(e.target.value)} rows={10} maxLength={60000} className="w-full rounded-xl border border-border bg-bg/60 p-3 text-sm outline-none focus:border-primary" placeholder="Paste the full text of your CV here (English or বাংলা)" />
              <Button type="button" onClick={submitPaste} disabled={text.trim().length < 80}>Analyse this text</Button>
            </div>
          )}
        </Card>
      )}

      {cv && !replace && busy !== "analyzing" && (
        <>
          <Card className="flex flex-wrap items-center gap-3">
            <FileText size={20} className="text-cyan" />
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{cv.fileName ?? "Pasted text"}</p>
              <p className="text-xs text-muted">{cv.status === "analyzed" ? (cv.reviewed ? "Analysed and reviewed" : "Analysed, please review below") : cv.status === "failed" ? "Analysis failed" : "Analysing…"}</p></div>
            {cv.status === "analyzed" && <Badge tone={cv.reviewed ? "success" : "warn"}>{cv.reviewed ? "Reviewed" : "Needs review"}</Badge>}
            <Button variant="secondary" onClick={() => setReplace(true)}>Replace</Button>
            <Button variant="danger" aria-label="Delete CV" onClick={() => { if (confirm("Delete your CV and its analysis?")) run("delete", () => call("DELETE"), "CV deleted."); }}><Trash2 size={15} /></Button>
          </Card>

          {cv.status === "failed" && (
            <Card className="border-danger/40">
              <p className="text-sm text-danger">{cv.error ?? "The analysis could not be completed."}</p>
              <Button className="mt-3" onClick={() => run("analyzing", () => call("PATCH"), "CV analysed. Please review the details below.")}>Try the analysis again</Button>
            </Card>
          )}

          {cv.status === "analyzed" && edit && (
            <>
              <Card className="space-y-4">
                <h2 className="font-display text-lg font-bold">Review and correct</h2>
                <p className="text-sm text-muted">AI can make mistakes. Fix anything that is wrong. We use this to find and rank jobs for you.</p>
                <div className="space-y-1.5"><label htmlFor="hl" className="text-sm font-medium">Headline</label><Input id="hl" maxLength={160} value={edit.headline ?? ""} onChange={(e) => setEdit({ ...edit, headline: e.target.value || null })} /></div>
                <div className="space-y-1.5"><label htmlFor="sm" className="text-sm font-medium">Summary</label><textarea id="sm" rows={4} maxLength={1200} value={edit.summary} onChange={(e) => setEdit({ ...edit, summary: e.target.value })} className="w-full rounded-xl border border-border bg-bg/60 p-3 text-sm outline-none focus:border-primary" /></div>
                <div className="space-y-1.5"><label htmlFor="lv" className="text-sm font-medium">Experience level</label>
                  <select id="lv" className={selectCls} value={edit.experienceLevel ?? ""} onChange={(e) => setEdit({ ...edit, experienceLevel: (e.target.value || null) as CvAnalysis["experienceLevel"] })}>
                    <option value="">Not sure</option>{Object.entries(LEVEL_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
                <TagEditor label="Skills" values={edit.skills} max={60} onChange={(skills) => setEdit({ ...edit, skills })} />
                <TagEditor label="Career fields" values={edit.careerFields} max={6} onChange={(careerFields) => setEdit({ ...edit, careerFields })} />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Roles that could suit you</p>
                  <ul className="space-y-2">
                    {edit.suggestedRoles.map((r, i) => (
                      <li key={`${r.title}-${i}`} className="flex items-start gap-2 rounded-xl border border-border p-3 text-sm">
                        <div className="min-w-0 flex-1"><p className="font-medium">{r.title}</p>{r.why && <p className="text-xs text-muted">{r.why}</p>}</div>
                        <button type="button" aria-label={`Remove ${r.title}`} onClick={() => setEdit({ ...edit, suggestedRoles: edit.suggestedRoles.filter((_, j) => j !== i) })} className="text-muted hover:text-danger"><X size={14} /></button>
                      </li>
                    ))}
                  </ul>
                </div>
                <Button disabled={busy === "save"} onClick={() => run("save", () => call("PUT", JSON.stringify({ headline: edit.headline, summary: edit.summary, experienceLevel: edit.experienceLevel, skills: edit.skills, careerFields: edit.careerFields, suggestedRoles: edit.suggestedRoles }), { "content-type": "application/json" }), "Saved. Your CV is reviewed.")}>
                  {busy === "save" ? "Saving…" : "Save and confirm"}</Button>
              </Card>

              {edit.experience.length > 0 && (
                <Card><h2 className="font-display text-lg font-bold">Experience found</h2>
                  <ul className="mt-3 space-y-3 text-sm">{edit.experience.map((x, i) => <li key={i}><p className="font-medium">{x.title}{x.company && ` · ${x.company}`}</p><p className="text-xs text-muted">{[x.start, x.end].filter(Boolean).join(" – ")}</p>{x.description && <p className="mt-1 text-muted">{x.description}</p>}</li>)}</ul></Card>
              )}
              {edit.education.length > 0 && (
                <Card><h2 className="font-display text-lg font-bold">Education found</h2>
                  <ul className="mt-3 space-y-2 text-sm">{edit.education.map((x, i) => <li key={i}><span className="font-medium">{x.degree}</span>{x.institution && ` · ${x.institution}`}{x.year && <span className="text-muted"> ({x.year})</span>}</li>)}</ul></Card>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
