"use client";
import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, Input } from "@/components/ui/primitives";
import { addCompany, addPage, refreshNow, removeCompany, removePage, testJooble } from "@/app/admin/sources/actions";

type Company = { id: string; name: string; ats: string; token: string; enabled: boolean; lastFetchAt: string | null; lastCount: number | null; lastError: string | null };
const selectCls = "rounded-xl border border-border bg-bg/60 px-3 py-2.5 text-sm outline-none focus:border-primary";

type Page = { id: string; name: string; url: string; kind: string; sector: string; lastFetchAt: string | null; lastCount: number | null; lastError: string | null };

export function SourcesControl({ companies, pages }: { companies: Company[]; pages: Page[] }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [f, setF] = useState({ name: "", ats: "greenhouse", token: "" });
  const [pg, setPg] = useState({ name: "", url: "", kind: "rss", sector: "government" });
  const report = (r: { ok: boolean; message: string }) => setMsg({ ok: r.ok, text: r.message });
  return (
    <div className="space-y-6">
      {msg && <p role="status" className={`whitespace-pre-line rounded-xl border px-4 py-3 text-sm ${msg.ok ? "border-success/40 text-success" : "border-danger/40 text-danger"}`}>{msg.text}</p>}
      <Card>
        <h2 className="font-display text-lg font-bold">Refresh now</h2>
        <p className="mt-1 text-sm text-muted">Fetches all key-free sources and every company board right away, ignoring the cache. Please use sparingly: Jobicy asks for at most a few checks per day.</p>
        <Button className="mt-3" disabled={pending} onClick={() => start(async () => report(await refreshNow()))}>{pending ? "Refreshing…" : "Refresh all sources"}</Button>
        <Button className="ml-2 mt-3" disabled={pending} onClick={() => start(async () => report(await testJooble()))}>{pending ? "Testing…" : "Test Jooble (Bangladesh)"}</Button>
      </Card>
      <Card>
        <h2 className="font-display text-lg font-bold">Company registry</h2>
        <p className="mt-1 text-sm text-muted">Add companies that publish jobs on Greenhouse or Lever. The board token is in their careers URL: <code>boards.greenhouse.io/<b>token</b></code> or <code>jobs.lever.co/<b>token</b></code>. Only public job data is read.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-[1.5fr_1fr_1.5fr_auto]">
          <Input aria-label="Company name" placeholder="Company name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <select aria-label="Platform" className={selectCls} value={f.ats} onChange={(e) => setF({ ...f, ats: e.target.value })}><option value="greenhouse">Greenhouse</option><option value="lever">Lever</option></select>
          <Input aria-label="Board token" placeholder="board token" value={f.token} onChange={(e) => setF({ ...f, token: e.target.value })} />
          <Button disabled={pending} onClick={() => start(async () => { const r = await addCompany({ name: f.name, ats: f.ats as "greenhouse", token: f.token }); report(r); if (r.ok) setF({ name: "", ats: f.ats, token: "" }); })}>Add</Button>
        </div>
        {companies.length > 0 && (
          <ul className="mt-5 space-y-2">
            {companies.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3 text-sm">
                <div className="min-w-0 flex-1"><p className="font-semibold">{c.name} <span className="font-normal text-muted">· {c.ats}/{c.token}</span></p>
                  <p className="text-xs text-muted">{c.lastFetchAt ? `Last fetch ${c.lastFetchAt.slice(0, 16).replace("T", " ")} UTC · ${c.lastCount ?? 0} jobs` : "Not fetched yet"}{c.lastError ? <span className="text-danger"> · {c.lastError}</span> : null}</p></div>
                <Button variant="danger" aria-label={`Remove ${c.name}`} disabled={pending} onClick={() => { if (confirm(`Remove ${c.name}?`)) start(async () => report(await removeCompany(c.id))); }}><Trash2 size={15} /></Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card>
        <h2 className="font-display text-lg font-bold">Official notice pages and RSS feeds</h2>
        <p className="mt-1 text-sm text-muted">Add public pages that list job circulars, for example a ministry, commission or company careers page, or any RSS/Atom feed. We only add a page if its robots.txt allows it, read it at most twice a day, and always link back to the original. Please read each site&apos;s terms first. Pages that need JavaScript or a login cannot be read; use RSS where the site offers it.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1.6fr_auto_auto_auto]">
          <Input aria-label="Source name" placeholder="Name (e.g. BPSC notices)" value={pg.name} onChange={(e) => setPg({ ...pg, name: e.target.value })} />
          <Input aria-label="Page URL" placeholder="https://…" value={pg.url} onChange={(e) => setPg({ ...pg, url: e.target.value })} />
          <select aria-label="Page kind" className={selectCls} value={pg.kind} onChange={(e) => setPg({ ...pg, kind: e.target.value })}><option value="rss">RSS/Atom feed</option><option value="html">Web page (AI reads it)</option></select>
          <select aria-label="Page sector" className={selectCls} value={pg.sector} onChange={(e) => setPg({ ...pg, sector: e.target.value })}><option value="government">Government</option><option value="private">Private</option><option value="ngo">NGO</option></select>
          <Button disabled={pending} onClick={() => start(async () => { const r = await addPage({ name: pg.name, url: pg.url, kind: pg.kind as "rss", sector: pg.sector as "government", country: "Bangladesh" }); report(r); if (r.ok) setPg({ ...pg, name: "", url: "" }); })}>Add</Button>
        </div>
        {pages.length > 0 && (
          <ul className="mt-5 space-y-2">
            {pages.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3 text-sm">
                <div className="min-w-0 flex-1"><p className="font-semibold">{c.name} <span className="font-normal text-muted">· {c.kind} · {c.sector}</span></p>
                  <p className="truncate text-xs text-muted">{c.url}</p>
                  <p className="text-xs text-muted">{c.lastFetchAt ? `Last read ${c.lastFetchAt.slice(0, 16).replace("T", " ")} UTC · ${c.lastCount ?? 0} items` : "Not read yet"}{c.lastError ? <span className="text-danger"> · {c.lastError}</span> : null}</p></div>
                <Button variant="danger" aria-label={`Remove ${c.name}`} disabled={pending} onClick={() => { if (confirm(`Remove ${c.name}?`)) start(async () => report(await removePage(c.id))); }}><Trash2 size={15} /></Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
