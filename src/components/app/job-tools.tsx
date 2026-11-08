"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";

type RefreshResult = { ok: boolean; message?: string; fetched?: number; sources?: { source: string; status: string; count: number; note?: string }[] };

export function JobTools() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function refresh() {
    setBusy(true); setMsg(null);
    const res = await fetch("/api/jobs/refresh", { method: "POST" });
    const r = (await res.json().catch(() => ({ ok: false, message: "Something went wrong." }))) as RefreshResult;
    setBusy(false);
    if (!r.ok) return setMsg({ ok: false, text: r.message ?? "Could not refresh." });
    const failed = r.sources?.filter((s) => s.status === "failed") ?? [];
    setMsg({ ok: true, text: `${r.fetched ?? 0} listings fetched.${failed.length ? ` ${failed.length} source(s) failed: ${failed.map((f) => `${f.source} (${f.note})`).join(", ")}.` : ""}${r.sources?.some((s) => s.status === "skipped") ? " " + r.sources.find((s) => s.status === "skipped")?.note : ""}` });
    router.refresh();
  }

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={refresh} disabled={busy}>{busy ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}Refresh jobs</Button>
      </div>
      {busy && <p className="text-sm text-muted">Fetching from the sources, this can take up to a minute…</p>}
      {msg && <p role="status" className={`text-sm ${msg.ok ? "text-success" : "text-danger"}`}>{msg.text}</p>}
    </Card>
  );
}
