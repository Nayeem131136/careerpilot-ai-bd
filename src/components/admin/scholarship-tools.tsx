"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, Input } from "@/components/ui/primitives";
import { addFromUrl, loadStarterList, publishAllPending, runRecheck } from "@/app/admin/scholarships/actions";

export function ScholarshipTools({ pending }: { pending: number }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [busy, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const go = (fn: () => Promise<{ ok: boolean; message: string; id?: string }>, after?: (id?: string) => void) => start(async () => {
    setMsg(null); const r = await fn(); setMsg({ ok: r.ok, text: r.message }); if (r.ok) { router.refresh(); after?.(r.id); }
  });
  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" disabled={busy} onClick={() => go(loadStarterList)}>Load starter list</Button>
        <Button variant="secondary" disabled={busy} onClick={() => go(runRecheck)}>Re-check links now</Button>
        <Button variant="secondary" disabled={busy || pending === 0} onClick={() => { if (confirm(`Publish all ${pending} pending programmes? Only do this after you checked them.`)) go(publishAllPending); }}>Publish all pending ({pending})</Button>
      </div>
      <div className="space-y-2">
        <h2 className="font-display text-lg font-bold">Add from an official page</h2>
        <p className="text-sm text-muted">Paste the link of a scholarship&apos;s own official page. AI fills the details from that page and puts it in the review queue. Nothing is shown to users until you check it and publish.</p>
        <div className="flex flex-wrap gap-2">
          <Input aria-label="Official scholarship link" className="max-w-xl flex-1" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://… official scholarship page" />
          <Button disabled={busy || !url.trim().startsWith("https://")} onClick={() => go(() => addFromUrl(url), (id) => { setUrl(""); if (id) router.push(`/admin/scholarships/${id}`); })}>{busy ? "Working…" : "Read page"}</Button>
        </div>
      </div>
      {msg && <p role="status" className={`text-sm ${msg.ok ? "text-success" : "text-danger"}`}>{msg.text}</p>}
    </Card>
  );
}
