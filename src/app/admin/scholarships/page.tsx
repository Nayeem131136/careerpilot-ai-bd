import Link from "next/link";
import { desc } from "drizzle-orm";
import { ActionButton } from "@/components/admin/action-button";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { ScholarshipTools } from "@/components/admin/scholarship-tools";
import { Badge, Card } from "@/components/ui/primitives";
import { db, schema } from "@/lib/db";
import { STALE_DAYS, levelLabel } from "@/lib/scholarships/types";
import { deleteScholarship, markVerified, setStatus } from "./actions";

export const metadata = { title: "Admin: scholarships" };
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Row = typeof schema.scholarships.$inferSelect;

function Item({ r, stale }: { r: Row; stale: boolean }) {
  return (
    <Card className="space-y-2 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Link href={`/admin/scholarships/${r.id}`} className="font-semibold hover:text-primary">{r.name}</Link>
        <span className="text-sm text-muted">{r.hostCountry} · {r.levels.map(levelLabel).join(", ")}</span>
        <Badge tone={r.funding === "full" ? "success" : "warn"}>{r.funding === "full" ? "Fully funded" : "Partial"}</Badge>
        {r.status === "published" && r.checkStatus === "changed" && <Badge tone="warn">Page changed</Badge>}
        {r.checkStatus === "broken" && <Badge tone="danger">Link broken</Badge>}
        {stale && <Badge tone="warn">Not verified in {STALE_DAYS}+ days</Badge>}
        {r.origin === "ai" && <Badge>AI-filled</Badge>}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="text-xs text-muted">{r.lastVerifiedAt ? `Verified ${r.lastVerifiedAt.toLocaleDateString("en-GB")}` : "Never verified"}{r.checkedAt ? ` · link checked ${r.checkedAt.toLocaleDateString("en-GB")}` : ""}</span>
        <a href={r.officialUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Open official page</a>
        <Link href={`/admin/scholarships/${r.id}`} className="text-xs text-primary hover:underline">Check / edit</Link>
        {r.status !== "published" && <ActionButton label="Publish" run={setStatus.bind(null, r.id, "published")} />}
        {r.status === "published" && <ActionButton label="Unpublish" run={setStatus.bind(null, r.id, "pending")} />}
        <ActionButton label="Mark verified" run={markVerified.bind(null, r.id)} />
        <ConfirmButton danger label="Delete" confirmText={`Delete “${r.name}”?`} run={deleteScholarship.bind(null, r.id)} />
      </div>
    </Card>
  );
}

export default async function Page() {
  const rows = await db.select().from(schema.scholarships).orderBy(desc(schema.scholarships.updatedAt));
  const cutoff = new Date(new Date().getTime() - STALE_DAYS * 86_400_000);
  const isStale = (r: Row) => r.status === "published" && (!r.lastVerifiedAt || r.lastVerifiedAt < cutoff);
  const pending = rows.filter((r) => r.status === "pending");
  const attention = rows.filter((r) => r.status === "published" && (r.checkStatus === "changed" || r.checkStatus === "broken"));
  const published = rows.filter((r) => r.status === "published");
  const archived = rows.filter((r) => r.status === "archived");
  const staleCount = published.filter(isStale).length;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-extrabold">Scholarships</h1>
          <p className="mt-1 text-sm text-muted">{published.length} published · {pending.length} to review · {attention.length} need attention · {staleCount} not verified in {STALE_DAYS}+ days. Users only see published ones.</p></div>
        <div className="flex gap-2">
          <Link href="/admin/scholarships/import" className="rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:border-primary/60">Bulk import</Link>
          <Link href="/admin/scholarships/new" className="rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:border-primary/60">Add by hand</Link>
        </div>
      </div>
      <ScholarshipTools pending={pending.length} />
      {attention.length > 0 && <section className="space-y-3"><h2 className="font-display text-lg font-bold">Needs attention</h2>{attention.map((r) => <Item key={r.id} r={r} stale={isStale(r)} />)}</section>}
      <section className="space-y-3"><h2 className="font-display text-lg font-bold">Review queue ({pending.length})</h2>{pending.map((r) => <Item key={r.id} r={r} stale={false} />)}{pending.length === 0 && <p className="text-sm text-muted">Nothing waiting. Add one from an official page or by hand.</p>}</section>
      <section className="space-y-3"><h2 className="font-display text-lg font-bold">Published ({published.length})</h2>{published.filter((r) => !attention.includes(r)).map((r) => <Item key={r.id} r={r} stale={isStale(r)} />)}</section>
      {archived.length > 0 && <section className="space-y-3"><h2 className="font-display text-lg font-bold">Archived ({archived.length})</h2>{archived.map((r) => <Item key={r.id} r={r} stale={false} />)}</section>}
    </div>
  );
}
