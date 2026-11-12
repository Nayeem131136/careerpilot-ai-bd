import Link from "next/link";
import { and, count, desc, eq, ilike, isNull, or } from "drizzle-orm";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Badge, Card } from "@/components/ui/primitives";
import { db, schema } from "@/lib/db";
import { daysLeft, parseDeadline } from "@/lib/deadlines/parse";
import { SOURCE_LABELS } from "@/lib/jobs/types";
import { deleteJob } from "./actions";

export const metadata = { title: "Admin: jobs" };
export const dynamic = "force-dynamic";
const PER = 25;

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; source?: string; page?: string }> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 80);
  const source = Object.keys(SOURCE_LABELS).includes(sp.source ?? "") ? sp.source! : "";
  const page = Math.max(1, Math.min(1000, Number.parseInt(sp.page ?? "1", 10) || 1));
  const like = q ? `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%` : null;
  const where = and(isNull(schema.jobs.ownerUserId), source ? eq(schema.jobs.source, source) : undefined, like ? or(ilike(schema.jobs.title, like), ilike(schema.jobs.company, like)) : undefined);
  const [{ n: total }] = await db.select({ n: count() }).from(schema.jobs).where(where);
  const rows = await db.select().from(schema.jobs).where(where).orderBy(desc(schema.jobs.fetchedAt)).limit(PER).offset((page - 1) * PER);
  const pages = Math.max(1, Math.ceil(total / PER));
  const link = (p: number) => `/admin/jobs?${new URLSearchParams({ ...(q ? { q } : {}), ...(source ? { source } : {}), page: String(p) })}`;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-extrabold">Jobs</h1><p className="mt-1 text-sm text-muted">{total} public job{total === 1 ? "" : "s"}. Remove anything that looks like spam, a scam or a wrong listing. Add jobs in <Link href="/admin/sources" className="text-primary hover:underline">Job sources</Link>.</p></div>
      <form className="flex flex-wrap gap-2" role="search">
        <input name="q" defaultValue={q} placeholder="Search title or company" aria-label="Search jobs" className="w-full max-w-xs rounded-xl border border-border bg-bg/60 px-3 py-2.5 text-sm outline-none focus:border-primary" />
        <select name="source" defaultValue={source} aria-label="Source" className="rounded-xl border border-border bg-bg/60 px-3 py-2.5 text-sm outline-none focus:border-primary">
          <option value="">All sources</option>
          {Object.entries(SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <button className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white">Search</button>
      </form>
      <div className="space-y-3">
        {rows.map((j) => (
          <Card key={j.id} className="space-y-1.5 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{j.title}</span>
              <span className="text-sm text-muted">{j.company}{j.location ? ` · ${j.location}` : ""}</span>
              <Badge>{SOURCE_LABELS[j.source]?.label ?? j.source}</Badge>
              {j.sector && <Badge>{j.sector}</Badge>}
              {(() => { const d = parseDeadline(j.deadline); return d && daysLeft(d) < 0 ? <Badge tone="danger">Closed</Badge> : null; })()}
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-xs text-muted">Fetched {j.fetchedAt.toLocaleDateString("en-GB")}</span>
              {/^https?:\/\//.test(j.url) && <a href={j.url} target="_blank" rel="noopener noreferrer nofollow" className="text-xs text-primary hover:underline">Open original</a>}
              <ConfirmButton danger label="Remove job" confirmText={`Remove “${j.title}” from the site?`} run={deleteJob.bind(null, j.id)} />
            </div>
          </Card>
        ))}
        {rows.length === 0 && <p className="text-sm text-muted">No jobs found.</p>}
      </div>
      {pages > 1 && (
        <nav className="flex items-center gap-4 text-sm" aria-label="Pages">
          {page > 1 && <Link href={link(page - 1)} className="text-primary hover:underline">← Previous</Link>}
          <span className="text-muted">Page {page} of {pages}</span>
          {page < pages && <Link href={link(page + 1)} className="text-primary hover:underline">Next →</Link>}
        </nav>
      )}
    </div>
  );
}
