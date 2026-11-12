"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ExternalLink, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import { parseDeadline, isoDay } from "@/lib/deadlines/parse";
import { KINDS, STATUSES, STATUS_LABEL, TONES, type AppStatus } from "@/lib/applications/types";

type Draft = { id: string; kind: string; language: string; subject: string; body: string; createdAt: string };
type App = { id: string; title: string; company: string; location: string | null; url: string | null; deadline: string | null; status: string; notes: string; appliedAt: string | null; description: string };

async function call(method: string, path: string, body?: unknown) {
  const res = await fetch(path, { method, headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  return (await res.json().catch(() => ({ ok: false, message: "Something went wrong." }))) as { ok: boolean; message?: string; draft?: Draft };
}
const input = "w-full rounded-xl border border-border bg-bg/60 px-3 py-2.5 text-sm outline-none focus:border-primary";

function DraftEditor({ appId, draft, onDeleted }: { appId: string; draft: Draft; onDeleted: () => void }) {
  const [subject, setSubject] = useState(draft.subject);
  const [body, setBody] = useState(draft.body);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState({ subject: draft.subject, body: draft.body });
  const dirty = subject !== saved.subject || body !== saved.body;
  async function save() {
    setBusy(true); setMsg(null);
    const r = await call("PUT", `/api/applications/${appId}/drafts`, { draftId: draft.id, subject, body });
    setBusy(false); setMsg(r.ok ? "Saved." : r.message ?? "Could not save.");
    if (r.ok) setSaved({ subject, body });
  }
  async function copy(text: string, what: string) {
    try { await navigator.clipboard.writeText(text); setMsg(`${what} copied.`); } catch { setMsg("Could not copy. Select the text and copy it manually."); }
  }
  async function remove() {
    if (!confirm("Delete this draft?")) return;
    const r = await call("DELETE", `/api/applications/${appId}/drafts`, { draftId: draft.id });
    if (r.ok) onDeleted(); else setMsg(r.message ?? "Could not delete.");
  }
  const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return (
    <Card className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{draft.kind === "email" ? "Email" : "Cover letter"} · {draft.language === "bn" ? "বাংলা" : "English"}</p>
      <input aria-label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} className={input} placeholder="Subject" />
      <textarea aria-label="Draft text" value={body} onChange={(e) => setBody(e.target.value)} rows={14} maxLength={8000} className={`${input} leading-relaxed`} />
      <p className="text-xs text-muted">Read it carefully. Replace anything in [square brackets] and check every fact before you send. You send this yourself.</p>
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={save} disabled={busy || !dirty}>{busy ? "Saving…" : "Save changes"}</Button>
        <Button variant="secondary" onClick={() => copy(body, "Text")}>Copy text</Button>
        {subject && <Button variant="secondary" onClick={() => copy(subject, "Subject")}>Copy subject</Button>}
        <a href={mailto} className="text-sm text-primary hover:underline">Open in my email app</a>
        <button type="button" onClick={remove} className="ml-auto text-sm text-muted hover:text-danger">Delete</button>
      </div>
      {msg && <p role="status" className="text-sm text-muted">{msg}</p>}
    </Card>
  );
}

export function ApplicationWorkspace({ app, drafts: initial, canDraft }: { app: App; drafts: Draft[]; canDraft: boolean }) {
  const router = useRouter();
  const [status, setStatus] = useState(app.status);
  const [notes, setNotes] = useState(app.notes);
  const [dl, setDl] = useState(() => { const d = parseDeadline(app.deadline); return d ? isoDay(d) : ""; });
  const [dlMsg, setDlMsg] = useState<string | null>(null);
  const [notesMsg, setNotesMsg] = useState<string | null>(null);
  const [drafts, setDrafts] = useState(initial);
  const [kind, setKind] = useState<(typeof KINDS)[number]>("cover_letter");
  const [language, setLanguage] = useState<"en" | "bn">("en");
  const [tone, setTone] = useState<(typeof TONES)[number]>("professional");
  const [instructions, setInstructions] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showJob, setShowJob] = useState(false);

  async function changeStatus(next: string) {
    const prev = status; setStatus(next);
    const r = await call("PATCH", `/api/applications/${app.id}`, { status: next });
    if (!r.ok) { setStatus(prev); return; }
    router.refresh();
  }
  async function saveDeadline(next: string) {
    setDl(next); setDlMsg(null);
    const r = await call("PATCH", `/api/applications/${app.id}`, { deadline: next });
    setDlMsg(r.ok ? (next ? "Deadline saved. It shows on your Deadlines page." : "Deadline cleared.") : r.message ?? "Could not save.");
  }
  async function saveNotes() {
    setNotesMsg(null);
    const r = await call("PATCH", `/api/applications/${app.id}`, { notes });
    setNotesMsg(r.ok ? "Notes saved." : r.message ?? "Could not save notes.");
  }
  async function generate() {
    setBusy(true); setErr(null);
    const r = await call("POST", `/api/applications/${app.id}/drafts`, { kind, language, tone, instructions });
    setBusy(false);
    if (!r.ok || !r.draft) return setErr(r.message ?? "Could not write the draft.");
    setDrafts((d) => [...d, r.draft!]);
    if (status === "interested") setStatus("drafting");
  }
  async function removeApp() {
    if (!confirm("Remove this application and its drafts?")) return;
    const r = await call("DELETE", `/api/applications/${app.id}`);
    if (r.ok) { router.push("/dashboard/applications"); router.refresh(); }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold">{app.title}</h1>
        <p className="text-sm text-muted">{app.company}{app.location ? ` · ${app.location}` : ""}{app.deadline ? ` · Deadline: ${app.deadline}` : ""}</p>
        <div className="flex flex-wrap gap-4 pt-1 text-sm">
          {app.url && <a href={app.url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 text-primary hover:underline">View original posting <ExternalLink size={12} /></a>}
          <button type="button" onClick={() => setShowJob((v) => !v)} className="text-primary hover:underline">{showJob ? "Hide job text" : "Show job text"}</button>
        </div>
        {showJob && <p className="whitespace-pre-line pt-2 text-sm text-muted">{app.description || "No description saved."}</p>}
      </div>

      <Card className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="status" className="text-sm font-medium">Status</label>
          <select id="status" value={status} onChange={(e) => changeStatus(e.target.value)} className="rounded-xl border border-border bg-bg/60 px-3 py-2 text-sm outline-none focus:border-primary">
            {STATUSES.map((st) => <option key={st} value={st}>{STATUS_LABEL[st as AppStatus]}</option>)}
          </select>
          {status !== "applied" && status !== "interview" && status !== "offer" && <button type="button" onClick={() => changeStatus("applied")} className="text-sm text-primary hover:underline">I have applied</button>}
          {app.appliedAt && <span className="text-xs text-muted">First marked applied on {new Date(app.appliedAt).toLocaleDateString("en-GB")}</span>}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="deadline" className="text-sm font-medium">Your deadline</label>
          <input id="deadline" type="date" value={dl} onChange={(e) => saveDeadline(e.target.value)} className="rounded-xl border border-border bg-bg/60 px-3 py-2 text-sm outline-none focus:border-primary" />
          {app.deadline && !dl && <span className="text-xs text-muted">The posting says: “{app.deadline}”</span>}
          {dlMsg && <span role="status" className="text-xs text-muted">{dlMsg}</span>}
        </div>
        <p className="text-xs text-muted">Update the status yourself after you send the application. CareerPilot cannot see whether you applied.</p>
      </Card>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold">Write a draft</h2>
        {!canDraft ? (
          <Card><p className="text-sm text-muted">Drafts use your CV. <Link href="/dashboard/cv" className="text-primary hover:underline">Upload and review your CV</Link> first.</p></Card>
        ) : (
          <Card className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="space-y-1.5 text-sm font-medium">Type
                <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} className={input}><option value="cover_letter">Cover letter</option><option value="email">Short email</option></select>
              </label>
              <label className="space-y-1.5 text-sm font-medium">Language
                <select value={language} onChange={(e) => setLanguage(e.target.value as "en" | "bn")} className={input}><option value="en">English</option><option value="bn">বাংলা</option></select>
              </label>
              <label className="space-y-1.5 text-sm font-medium">Tone
                <select value={tone} onChange={(e) => setTone(e.target.value as typeof tone)} className={input}><option value="professional">Professional</option><option value="friendly">Friendly</option><option value="concise">Short and direct</option></select>
              </label>
            </div>
            <label className="block space-y-1.5 text-sm font-medium">Anything to stress? (optional)
              <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={2} maxLength={500} placeholder="e.g. mention my final-year project, I can join immediately" className={input} />
            </label>
            <Button onClick={generate} disabled={busy}>{busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}{busy ? "Writing…" : "Write draft"}</Button>
            {err && <p role="alert" className="text-sm text-danger">{err}</p>}
          </Card>
        )}
        {drafts.map((d) => <DraftEditor key={d.id} appId={app.id} draft={d} onDeleted={() => setDrafts((all) => all.filter((x) => x.id !== d.id))} />)}
      </section>

      <Card className="space-y-3">
        <label htmlFor="notes" className="text-sm font-medium">Your notes</label>
        <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} maxLength={4000} placeholder="Contact person, interview date, things to prepare…" className={input} />
        <div className="flex items-center gap-3"><Button variant="secondary" onClick={saveNotes}>Save notes</Button>{notesMsg && <span role="status" className="text-sm text-muted">{notesMsg}</span>}</div>
      </Card>

      <button type="button" onClick={removeApp} className="text-sm text-muted hover:text-danger">Remove this application</button>
    </div>
  );
}
