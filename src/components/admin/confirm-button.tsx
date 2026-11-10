"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function ConfirmButton({ label, confirmText, run, danger }: { label: string; confirmText: string; run: () => Promise<{ ok: boolean; message: string }>; danger?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col items-start">
      <button type="button" disabled={pending} onClick={() => { if (!confirm(confirmText)) return; setMsg(null); start(async () => { const r = await run(); if (!r.ok) setMsg(r.message); else router.refresh(); }); }}
        className={`text-xs font-medium hover:underline disabled:opacity-50 ${danger ? "text-danger" : "text-primary"}`}>{pending ? "Working…" : label}</button>
      {msg && <span role="alert" className="text-xs text-danger">{msg}</span>}
    </span>
  );
}
