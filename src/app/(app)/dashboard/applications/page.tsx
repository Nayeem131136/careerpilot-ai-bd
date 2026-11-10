import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Briefcase } from "lucide-react";
import { Badge, Card, EmptyState } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { db, schema } from "@/lib/db";
import { STATUSES, STATUS_LABEL, type AppStatus } from "@/lib/applications/types";
import { requireSession } from "@/lib/session";

export const metadata = { title: "Applications" };
export const dynamic = "force-dynamic";

const TONE: Record<AppStatus, "default" | "success" | "warn" | "danger"> = { interested: "default", drafting: "default", applied: "warn", interview: "success", offer: "success", rejected: "danger", withdrawn: "danger" };

export default async function Page({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const s = await requireSession();
  const sp = await searchParams;
  const filter = (STATUSES as readonly string[]).includes(sp.status ?? "") ? (sp.status as AppStatus) : null;
  const rows = await db.select().from(schema.applications).where(eq(schema.applications.userId, s.user.id)).orderBy(desc(schema.applications.updatedAt));
  const counts = new Map<string, number>();
  for (const r of rows) counts.set(r.status, (counts.get(r.status) ?? 0) + 1);
  const shown = filter ? rows.filter((r) => r.status === filter) : rows;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Applications</h1>
        <p className="mt-1 text-sm text-muted">Track the jobs you are going for and prepare drafts. CareerPilot never sends anything: you copy the draft and send it yourself.</p>
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={<Briefcase size={28} />} title="No applications yet" action={<ButtonLink href="/dashboard/jobs">Browse jobs</ButtonLink>}>
          Open a job and press “Prepare application” to start a draft and track it here.
        </EmptyState>
      ) : (
        <>
          <nav className="flex flex-wrap gap-2 text-sm" aria-label="Filter by status">
            <Link href="/dashboard/applications" className={`rounded-full border px-3 py-1 ${!filter ? "border-primary bg-primary/10 text-primary" : "border-border text-muted hover:text-fg"}`}>All ({rows.length})</Link>
            {STATUSES.filter((st) => counts.get(st)).map((st) => (
              <Link key={st} href={`/dashboard/applications?status=${st}`} className={`rounded-full border px-3 py-1 ${filter === st ? "border-primary bg-primary/10 text-primary" : "border-border text-muted hover:text-fg"}`}>{STATUS_LABEL[st]} ({counts.get(st)})</Link>
            ))}
          </nav>
          <div className="space-y-3">
            {shown.map((a) => (
              <Card key={a.id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <Link href={`/dashboard/applications/${a.id}`} className="font-display font-bold hover:underline">{a.jobTitle}</Link>
                  <p className="text-sm text-muted">{a.company}{a.location ? ` · ${a.location}` : ""}{a.deadline ? ` · Deadline: ${a.deadline}` : ""}</p>
                </div>
                <Badge tone={TONE[a.status as AppStatus] ?? "default"}>{STATUS_LABEL[a.status as AppStatus] ?? a.status}</Badge>
                <span className="text-xs text-muted">{a.appliedAt ? `Applied ${a.appliedAt.toLocaleDateString("en-GB")}` : `Updated ${a.updatedAt.toLocaleDateString("en-GB")}`}</span>
                <Link href={`/dashboard/applications/${a.id}`} className="text-sm text-primary hover:underline">Open</Link>
              </Card>
            ))}
            {shown.length === 0 && <p className="text-sm text-muted">Nothing with this status.</p>}
          </div>
        </>
      )}
    </div>
  );
}
