import { and, asc, arrayContains, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { ShieldAlert } from "lucide-react";
import { ScholarshipCard } from "@/components/app/scholarship-card";
import { Card, EmptyState } from "@/components/ui/primitives";
import { db, schema } from "@/lib/db";
import { LEVELS, LEVEL_KEYS } from "@/lib/scholarships/types";
import { toCard } from "@/lib/scholarships/view";
import { requireSession } from "@/lib/session";

export const metadata = { title: "Scholarships" };
export const dynamic = "force-dynamic";

type SP = { level?: string; country?: string; funding?: string; q?: string; bd?: string; saved?: string };
const sel = "rounded-xl border border-border bg-bg/60 px-3 py-2.5 text-sm outline-none focus:border-primary";

export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  const s = await requireSession();
  const sp = await searchParams;
  const level = (LEVEL_KEYS as string[]).includes(sp.level ?? "") ? sp.level! : "";
  const funding = sp.funding === "full" || sp.funding === "partial" ? sp.funding : "";
  const q = (sp.q ?? "").trim().slice(0, 80);
  const country = (sp.country ?? "").slice(0, 80);
  const bd = sp.bd === "1", onlySaved = sp.saved === "1";
  const like = q ? `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%` : null;

  const savedRows = await db.select({ id: schema.scholarshipSaves.scholarshipId }).from(schema.scholarshipSaves).where(eq(schema.scholarshipSaves.userId, s.user.id));
  const savedIds = new Set(savedRows.map((r) => r.id));
  const published = eq(schema.scholarships.status, "published");
  const countries = (await db.selectDistinct({ c: schema.scholarships.hostCountry }).from(schema.scholarships).where(published).orderBy(asc(schema.scholarships.hostCountry))).map((r) => r.c);

  const rows = await db.select().from(schema.scholarships).where(and(
    published,
    level ? arrayContains(schema.scholarships.levels, [level]) : undefined,
    funding ? eq(schema.scholarships.funding, funding) : undefined,
    country ? eq(schema.scholarships.hostCountry, country) : undefined,
    bd ? eq(schema.scholarships.bangladeshEligible, "yes") : undefined,
    onlySaved ? (savedIds.size ? inArray(schema.scholarships.id, [...savedIds]) : sql`false`) : undefined,
    like ? or(ilike(schema.scholarships.name, like), ilike(schema.scholarships.provider, like), ilike(schema.scholarships.hostCountry, like), sql`array_to_string(${schema.scholarships.universities}, ' ') ilike ${like}`, sql`array_to_string(${schema.scholarships.fields}, ' ') ilike ${like}`) : undefined,
  )).orderBy(asc(schema.scholarships.hostCountry), asc(schema.scholarships.name)).limit(300);

  const now = new Date();
  const groups = new Map<string, ReturnType<typeof toCard>[]>();
  for (const r of rows) { const c = toCard(r, now); groups.set(r.hostCountry, [...(groups.get(r.hostCountry) ?? []), c]); }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Scholarships</h1>
        <p className="mt-1 text-sm text-muted">Fully and partly funded scholarships from governments, universities and foundations, with links to the official pages. Grouped by country.</p>
      </div>
      <Card className="flex gap-3 border-warn/40 bg-warn/5 p-4 text-sm">
        <ShieldAlert size={20} className="mt-0.5 shrink-0 text-warn" aria-hidden="true" />
        <p className="text-muted"><b className="text-fg">Stay safe.</b> Real scholarships do not charge application fees or ask you to pay an agent. Apply only on the official page linked on each card, and always re-read the rules and deadline there: details change every year. We do not take part in selection and cannot promise an award.</p>
      </Card>
      <form className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6" role="search">
        <input name="q" defaultValue={q} placeholder="Search name, country, university…" aria-label="Search scholarships" className={`${sel} sm:col-span-2`} />
        <select name="level" defaultValue={level} aria-label="Study level" className={sel}><option value="">All levels</option>{LEVELS.map((l) => <option key={l.key} value={l.key}>{l.label}</option>)}</select>
        <select name="country" defaultValue={country} aria-label="Country" className={sel}><option value="">All countries</option>{countries.map((c) => <option key={c} value={c}>{c}</option>)}</select>
        <select name="funding" defaultValue={funding} aria-label="Funding" className={sel}><option value="">Any funding</option><option value="full">Fully funded</option><option value="partial">Partial</option></select>
        <button className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white">Search</button>
        <label className="flex items-center gap-2 text-sm sm:col-span-1"><input type="checkbox" name="bd" value="1" defaultChecked={bd} />Confirmed for Bangladesh</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="saved" value="1" defaultChecked={onlySaved} />Saved only</label>
      </form>
      {rows.length === 0 ? (
        <EmptyState title={onlySaved ? "Nothing saved yet" : "No scholarships found"}>{onlySaved ? "Tap the bookmark on a scholarship to keep it here." : "Try a different level or country, or clear the filters. The list grows as the site team adds and verifies programmes."}</EmptyState>
      ) : (
        <div className="space-y-8">
          <p className="text-sm text-muted">{rows.length} scholarship{rows.length === 1 ? "" : "s"} in {groups.size} countr{groups.size === 1 ? "y" : "ies"}</p>
          {[...groups.entries()].map(([c, list]) => (
            <section key={c} className="space-y-3" aria-labelledby={`c-${c}`}>
              <h2 id={`c-${c}`} className="font-display text-xl font-bold">{c} <span className="text-sm font-normal text-muted">({list.length})</span></h2>
              <div className="grid gap-4 lg:grid-cols-2">{list.map((x) => <ScholarshipCard key={x.id} s={x} saved={savedIds.has(x.id)} />)}</div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
