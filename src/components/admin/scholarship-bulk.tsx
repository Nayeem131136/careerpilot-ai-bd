"use client";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/primitives";
import { bulkImport, type BulkItem } from "@/app/admin/scholarships/actions";
import { splitBlocks, toCandidate } from "@/lib/scholarships/parse";

export function ScholarshipBulk() {
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string; items: BulkItem[] } | null>(null);
  const preview = useMemo(() => splitBlocks(text).slice(0, 60).map(toCandidate), [text]);
  const good = preview.filter((p) => p.ok).length;
  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <p className="text-sm text-muted">Paste several scholarships at once, one after another. Each one must start with a <b className="text-fg">Name:</b> line and use the same labels as the single-scholarship format. Up to 60 at a time.</p>
        <textarea aria-label="Scholarships to import" rows={12} value={text} onChange={(e) => { setText(e.target.value); setResult(null); }} className="w-full rounded-xl border border-border bg-bg/60 p-3 text-sm outline-none focus:border-primary" placeholder={"Name: …\nProvider: …\nCountry of study: …\nOfficial link: https://…\n\nName: …"} />
        {preview.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm"><b>{preview.length}</b> found · <span className="text-success">{good} ready</span>{preview.length - good > 0 && <> · <span className="text-danger">{preview.length - good} have problems</span></>}</p>
            <ul className="space-y-1.5">
              {preview.map((p, i) => <li key={i} className="flex flex-wrap items-center gap-2 text-sm"><Badge tone={p.ok ? "success" : "danger"}>{p.ok ? "Ready" : "Fix"}</Badge><span className="font-medium">{p.ok ? p.input.name : p.name}</span>{p.ok ? <span className="text-muted">{p.input.hostCountry} · {p.input.levels.join(", ")}</span> : <span className="text-danger">{p.issues.join("; ")}</span>}</li>)}
            </ul>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Button disabled={pending || good === 0} onClick={() => start(async () => setResult(await bulkImport(text)))}>{pending ? "Importing…" : `Import ${good || ""} to review queue`}</Button>
          <p className="text-xs text-muted">Nothing is shown to users until you check each one and publish it.</p>
        </div>
      </Card>
      {result && (
        <Card className="space-y-2">
          <p role="status" className={`text-sm font-medium ${result.ok ? "text-success" : "text-danger"}`}>{result.message}</p>
          <ul className="space-y-1 text-sm">
            {result.items.map((i, k) => <li key={k} className="flex flex-wrap items-center gap-2"><Badge tone={i.status === "added" ? "success" : i.status === "duplicate" ? "warn" : "danger"}>{i.status}</Badge>{i.id ? <Link href={`/admin/scholarships/${i.id}`} className="text-primary hover:underline">{i.name}</Link> : <span>{i.name}</span>}{i.detail && <span className="text-muted">{i.detail}</span>}</li>)}
          </ul>
          <Link href="/admin/scholarships" className="text-sm text-primary hover:underline">Open the review queue</Link>
        </Card>
      )}
    </div>
  );
}
