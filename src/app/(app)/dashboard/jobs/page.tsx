import Link from "next/link";
import { JobCard } from "@/components/app/job-card";
import { JobTools } from "@/components/app/job-tools";
import { Card } from "@/components/ui/primitives";
import { env } from "@/lib/env";
import { coverage } from "@/lib/jobs/ingest";
import { getFeed } from "@/lib/jobs/feed";
import { SOURCE_LABELS } from "@/lib/jobs/types";
import { COUNTRIES } from "@/lib/options";
import { requireSession } from "@/lib/session";

export const metadata = { title: "Jobs" };
export const dynamic = "force-dynamic";
type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function JobsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const s = await requireSession();
  const filters = { q: one(sp.q).slice(0, 80), country: one(sp.country).slice(0, 60), remote: one(sp.remote) === "1", source: one(sp.source).slice(0, 20), sector: ["government", "private", "ngo"].includes(one(sp.sector)) ? one(sp.sector) : "", workMode: ["onsite", "hybrid", "remote", "home"].includes(one(sp.workMode)) ? one(sp.workMode) : "", saved: one(sp.saved) === "1", page: Math.max(1, Number(one(sp.page)) || 1) };
  const [feed, cov] = await Promise.all([getFeed(s.user.id, filters), coverage()]);
  const qs = (over: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    const all = { q: filters.q, country: filters.country, remote: filters.remote ? "1" : "", source: filters.source, sector: filters.sector, workMode: filters.workMode, saved: filters.saved ? "1" : "", ...over };
    for (const [k, v] of Object.entries(all)) if (v) p.set(k, String(v));
    const t = p.toString();
    return t ? `?${t}` : "";
  };
  const keyed = { adzuna: Boolean(env.ADZUNA_APP_ID && env.ADZUNA_APP_KEY), jooble: Boolean(env.JOOBLE_API_KEY) };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Jobs</h1>
        <p className="mt-1 text-sm text-muted">Every kind of job in Bangladesh, plus remote jobs from anywhere in the world. Pick a country to see all jobs there. Ordered by how well they fit your CV and preferences. You always apply yourself, we never apply for you.</p>
      </div>

      {feed.profile.cvStatus === "none" && (
        <Card className="border-warn/50"><p className="text-sm"><span className="font-semibold text-warn">Not personalised yet.</span> <span className="text-muted">Upload and review your CV to rank jobs for you. </span><Link href="/dashboard/cv" className="text-primary hover:underline">Open My CV</Link></p></Card>
      )}

      <JobTools />

      <form className="grid gap-3 rounded-2xl border border-border bg-card/50 p-4 sm:grid-cols-2 lg:grid-cols-5" role="search">
        <input name="q" defaultValue={filters.q} placeholder="Search title or company" aria-label="Search jobs" className="min-w-0 rounded-xl border border-border bg-bg/60 px-3 py-2.5 text-sm outline-none focus:border-primary" />
        <select name="country" defaultValue={filters.country} aria-label="Country" className="min-w-0 rounded-xl border border-border bg-bg/60 px-3 py-2.5 text-sm outline-none focus:border-primary">
          <option value="">Bangladesh + remote worldwide</option>{COUNTRIES.filter((c) => !c.startsWith("Remote")).map((c) => <option key={c}>{c}</option>)}
        </select>
        <select name="source" defaultValue={filters.source} aria-label="Source" className="min-w-0 rounded-xl border border-border bg-bg/60 px-3 py-2.5 text-sm outline-none focus:border-primary">
          <option value="">All sources</option>{Object.entries(SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select name="sector" defaultValue={filters.sector} aria-label="Sector" className="min-w-0 rounded-xl border border-border bg-bg/60 px-3 py-2.5 text-sm outline-none focus:border-primary">
          <option value="">Govt + private</option><option value="government">Government</option><option value="private">Private</option><option value="ngo">NGO</option>
        </select>
        <select name="workMode" defaultValue={filters.workMode} aria-label="Work mode" className="min-w-0 rounded-xl border border-border bg-bg/60 px-3 py-2.5 text-sm outline-none focus:border-primary">
          <option value="">Any work mode</option><option value="onsite">Onsite</option><option value="hybrid">Hybrid</option><option value="remote">Remote</option><option value="home">Work from home</option>
        </select>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 sm:col-span-2 lg:col-span-5">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="remote" value="1" defaultChecked={filters.remote} className="size-4 accent-[var(--primary)]" />Remote</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="saved" value="1" defaultChecked={filters.saved} className="size-4 accent-[var(--primary)]" />Saved</label>
        <button className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white">Apply filters</button>
        </div>
      </form>

      {feed.jobs.length === 0 ? (
        <Card><p className="text-sm text-muted">{cov.total === 0 ? "No jobs loaded yet. Press “Refresh jobs” above to fetch the latest from the connected sources." : "No jobs match these filters."}</p></Card>
      ) : (
        <>
          <p className="text-sm text-muted">{feed.total} jobs{filters.q || filters.country || filters.remote || filters.source || filters.sector || filters.workMode || filters.saved ? " match your filters" : ""}</p>
          <div className="space-y-3">{feed.jobs.map((j) => <JobCard key={j.id} job={{ id: j.id, title: j.title, company: j.company, location: j.location, country: j.country, remote: j.remote, jobType: j.jobType, description: j.description, url: j.url, source: j.source, postedAt: j.postedAt?.toISOString() ?? null, saved: j.saved, sector: j.sector, workMode: j.workMode, deadline: j.deadline, salary: j.salaryMin ? `${j.salaryMin.toLocaleString()}${j.salaryMax ? `–${j.salaryMax.toLocaleString()}` : "+"} ${j.salaryCurrency ?? ""}`.trim() : null, score: feed.profile.hasSignal ? j.rank.score : null, matchedSkills: j.rank.matchedSkills, notes: j.rank.notes }} />)}</div>
          {(feed.pages ?? 1) > 1 && (
            <nav className="flex items-center justify-between text-sm" aria-label="Pagination">
              {feed.page! > 1 ? <Link className="text-primary hover:underline" href={`/dashboard/jobs${qs({ page: feed.page! - 1 })}`}>← Previous</Link> : <span />}
              <span className="text-muted">Page {feed.page} of {feed.pages}</span>
              {feed.page! < feed.pages! ? <Link className="text-primary hover:underline" href={`/dashboard/jobs${qs({ page: feed.page! + 1 })}`}>Next →</Link> : <span />}
            </nav>
          )}
        </>
      )}

      <Card>
        <h2 className="font-display text-lg font-bold">Source coverage</h2>
        <p className="mt-1 text-sm text-muted">No job site has every job in the world. This shows exactly where the jobs above come from.</p>
        <ul className="mt-3 space-y-1.5 text-sm">
          {cov.bySource.length === 0 && <li className="text-muted">Nothing loaded yet.</li>}
          {cov.bySource.map((c) => <li key={c.source}>{SOURCE_LABELS[c.source]?.label ?? c.source}: <span className="font-medium">{c.n}</span> jobs{c.last && !c.last.ok ? <span className="text-danger"> (last fetch failed)</span> : null}</li>)}
          <li>Adzuna (UK, US, Australia, Canada, Germany, etc.): <span className="text-muted">{keyed.adzuna ? "connected" : "not connected by the site admin yet"}</span></li>
          <li>Jooble (many countries, including Bangladesh): <span className="text-muted">{keyed.jooble ? "connected" : "not connected by the site admin yet"}</span></li>
        </ul>
        <p className="mt-3 text-sm text-muted">Bangladesh jobs currently loaded: <span className="font-medium text-fg">{cov.bangladesh}</span>. Many Bangladeshi jobs are only on local sites or Facebook, so use “Add a job circular” to paste them in, and we will read them in Bengali or English.</p>
      </Card>
    </div>
  );
}
