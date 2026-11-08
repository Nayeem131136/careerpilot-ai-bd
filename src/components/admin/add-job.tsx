"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, Input } from "@/components/ui/primitives";

export function AddJob() {
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit() {
    setBusy(true); setMsg(null);
    const res = await fetch("/api/jobs/paste", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: text.trim() || undefined, url: url.trim() || undefined }) });
    const r = (await res.json().catch(() => ({ ok: false, message: "Something went wrong." }))) as { ok: boolean; message?: string };
    setBusy(false);
    if (!r.ok) return setMsg({ ok: false, text: r.message ?? "Could not add this job." });
    setMsg({ ok: true, text: "Job published for all users." }); setText(""); setUrl("");
  }

  return (
    <Card className="space-y-3">
      <h2 className="font-display text-lg font-bold">Add a job for everyone</h2>
      <p className="text-sm text-muted">Paste a link to a job page, or the text of a circular (newspaper, Facebook, Bdjobs, email) in English or বাংলা. We read it with AI and publish it to every user&apos;s job list, with a link to the original.</p>
      <Input aria-label="Job link" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://… link to the job (optional if you paste the text)" />
      <textarea aria-label="Paste job circular" rows={8} maxLength={12000} value={text} onChange={(e) => setText(e.target.value)} placeholder="Or paste the circular text here" className="w-full rounded-xl border border-border bg-bg/60 p-3 text-sm outline-none focus:border-primary" />
      <Button onClick={submit} disabled={busy || (text.trim().length < 80 && !url.trim())}>{busy ? "Reading…" : "Read and publish"}</Button>
      {msg && <p role="status" className={`text-sm ${msg.ok ? "text-success" : "text-danger"}`}>{msg.text}</p>}
    </Card>
  );
}
