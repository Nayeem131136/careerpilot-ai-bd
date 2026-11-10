import Link from "next/link";
import { eq } from "drizzle-orm";
import { RoadmapView } from "@/components/app/roadmap-view";
import { Card } from "@/components/ui/primitives";
import type { CvAnalysis } from "@/lib/cv/schema";
import { db, schema } from "@/lib/db";
import { skillGaps } from "@/lib/roadmap/gaps";
import { roadmapSchema } from "@/lib/roadmap/schema";
import { requireSession } from "@/lib/session";

export const metadata = { title: "Skills & roadmap" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const s = await requireSession();
  const [cv] = await db.select().from(schema.cvs).where(eq(schema.cvs.userId, s.user.id));
  const parsed = cv?.status === "analyzed" ? (cv.parsed as CvAnalysis | null) : null;
  if (!parsed) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-extrabold">Skills &amp; roadmap</h1>
        <Card><p className="text-sm text-muted">The roadmap is built from your CV. <Link href="/dashboard/cv" className="text-primary hover:underline">Upload and review your CV</Link> first.</p></Card>
      </div>
    );
  }
  const [prefs] = await db.select().from(schema.careerPreferences).where(eq(schema.careerPreferences.userId, s.user.id));
  const [row] = await db.select().from(schema.roadmaps).where(eq(schema.roadmaps.userId, s.user.id));
  const { gaps, analysed } = await skillGaps(s.user.id);
  const roles = [...new Set([...(prefs?.jobTitles ?? []), ...parsed.suggestedRoles.map((r) => r.title)].map((r) => r.trim()).filter(Boolean))].slice(0, 10);
  const rm = row ? roadmapSchema.safeParse(row.data) : null;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Skills &amp; roadmap</h1>
        <p className="mt-1 text-sm text-muted">See which skills the jobs you analysed ask for that your CV does not show, and get a step-by-step plan to close the gap.</p>
      </div>
      <RoadmapView
        skills={parsed.skills.slice(0, 40)} gaps={gaps} analysed={analysed} roles={roles}
        stale={row ? row.cvUpdatedAt.getTime() < (cv?.updatedAt.getTime() ?? 0) : false}
        saved={row && rm?.success ? { roadmap: rm.data, progress: row.progress as Record<string, boolean>, targetRole: row.targetRole, hoursPerWeek: row.hoursPerWeek } : null}
      />
    </div>
  );
}
