"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

/** Runs a server action without a confirm dialog (for safe, reversible actions). */
export function ActionButton({ label, run, confirmText }: { label: string; run: () => Promise<{ ok: boolean; message: string }>; confirmText?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <span className="inline-flex flex-col items-start">
      <button type="button" disabled={pending} onClick={() => { if (confirmText && !confirm(confirmText)) return; setMsg(null); start(async () => { const r = await run(); setMsg({ ok: r.ok, text: r.message }); if (r.ok) router.refresh(); }); }}
        className="text-xs font-medium text-primary hover:underline disabled:opacity-50">{pending ? "Working…" : label}</button>
      {msg && <span role="status" className={`max-w-xl whitespace-pre-line text-xs ${msg.ok ? "text-success" : "text-danger"}`}>{msg.text}</span>}
    </span>
  );
}
