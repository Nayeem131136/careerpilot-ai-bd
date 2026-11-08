import { db, schema } from "@/lib/db";
import { env } from "@/lib/env";
import { coverage } from "@/lib/jobs/ingest";
import { SOURCE_LABELS } from "@/lib/jobs/types";
import { SourcesControl } from "@/components/admin/sources-control";
import { AddJob } from "@/components/admin/add-job";
import { Card } from "@/components/ui/primitives";

export default async function SourcesPage() {
  const [companies, pages, cov] = await Promise.all([db.select().from(schema.companySources).orderBy(schema.companySources.name), db.select().from(schema.pageSources).orderBy(schema.pageSources.name), coverage()]);
  const rows: { key: string; note: string; on: boolean }[] = [
    { key: "jobicy", note: "Remote jobs worldwide. Free, no key. Cached 6 hours.", on: true },
    { key: "arbeitnow", note: "Europe/Germany jobs, many with visa sponsorship. Free, no key.", on: true },
    { key: "adzuna", note: "UK, US, Australia, Canada, Germany, etc. Needs ADZUNA_APP_ID and ADZUNA_APP_KEY.", on: Boolean(env.ADZUNA_APP_ID && env.ADZUNA_APP_KEY) },
    { key: "jooble", note: "Many countries, possibly including Bangladesh. Needs JOOBLE_API_KEY.", on: Boolean(env.JOOBLE_API_KEY) },
  ];
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-extrabold">Job sources</h1><p className="mt-1 text-sm text-muted">Where the site&apos;s jobs come from. Remotive is intentionally not used, because its terms forbid showing jobs to collect sign-ups.</p></div>
      <Card>
        <h2 className="font-display text-lg font-bold">Connected sources</h2>
        <ul className="mt-3 space-y-3 text-sm">
          {rows.map((r) => {
            const c = cov.bySource.find((x) => x.source === r.key);
            return <li key={r.key}><p className="font-semibold">{SOURCE_LABELS[r.key].label} <span className={r.on ? "text-success" : "text-warn"}>· {r.on ? "enabled" : "needs a key"}</span></p>
              <p className="text-xs text-muted">{r.note} {c ? `${c.n} jobs stored.` : ""}{c?.last && !c.last.ok ? <span className="text-danger"> Last error: {c.last.error}</span> : null}</p></li>;
          })}
        </ul>
        <p className="mt-4 text-sm text-muted">Total shared jobs: {cov.total}. Bangladesh: {cov.bangladesh}. Keys are set as environment variables in your host, then redeploy.</p>
      </Card>
      <AddJob />
      <SourcesControl pages={pages.map((p) => ({ id: p.id, name: p.name, url: p.url, kind: p.kind, sector: p.sector, lastFetchAt: p.lastFetchAt?.toISOString() ?? null, lastCount: p.lastCount, lastError: p.lastError }))} companies={companies.map((c) => ({ id: c.id, name: c.name, ats: c.ats, token: c.token, enabled: c.enabled, lastFetchAt: c.lastFetchAt?.toISOString() ?? null, lastCount: c.lastCount, lastError: c.lastError }))} />
    </div>
  );
}
