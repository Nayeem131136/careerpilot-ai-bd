import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { ApplicationWorkspace } from "@/components/app/application-workspace";
import { db, schema } from "@/lib/db";
import { requireSession } from "@/lib/session";

export const metadata = { title: "Application" };
export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const [app] = await db.select().from(schema.applications).where(and(eq(schema.applications.id, id), eq(schema.applications.userId, s.user.id)));
  if (!app) notFound();
  const drafts = await db.select().from(schema.applicationDrafts).where(eq(schema.applicationDrafts.applicationId, app.id)).orderBy(asc(schema.applicationDrafts.createdAt));
  const [cv] = await db.select({ status: schema.cvs.status }).from(schema.cvs).where(eq(schema.cvs.userId, s.user.id));
  return (
    <div className="space-y-6">
      <Link href="/dashboard/applications" className="text-sm text-primary hover:underline">← All applications</Link>
      <ApplicationWorkspace
        canDraft={cv?.status === "analyzed"}
        app={{ id: app.id, title: app.jobTitle, company: app.company, location: app.location, url: app.jobUrl, deadline: app.deadline, status: app.status, notes: app.notes, appliedAt: app.appliedAt?.toISOString() ?? null, description: app.jobDescription.slice(0, 3000) }}
        drafts={drafts.map((d) => ({ id: d.id, kind: d.kind, language: d.language, subject: d.subject, body: d.body, createdAt: d.createdAt.toISOString() }))}
      />
    </div>
  );
}
