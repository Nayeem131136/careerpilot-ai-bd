import { eq } from "drizzle-orm";
import { CvManager } from "@/components/app/cv-manager";
import { db, schema } from "@/lib/db";
import { getAiStatus } from "@/lib/ai/service";
import type { CvAnalysis } from "@/lib/cv/schema";
import { requireSession } from "@/lib/session";

export const metadata = { title: "My CV" };

export default async function CvPage() {
  const s = await requireSession();
  const [cv] = await db.select().from(schema.cvs).where(eq(schema.cvs.userId, s.user.id));
  const ai = await getAiStatus();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">My CV</h1>
        <p className="mt-1 text-sm text-muted">Upload your CV in English or Bengali. AI reads it, you review and correct it. We never apply to anything for you.</p>
      </div>
      <CvManager
        aiReady={ai.configured}
        cv={cv ? { fileName: cv.fileName, status: cv.status as "pending" | "analyzed" | "failed", error: cv.error, reviewed: Boolean(cv.reviewedAt), parsed: (cv.parsed as CvAnalysis | null) ?? null } : null}
      />
    </div>
  );
}
