"use server";
import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { requireAdminAction } from "@/lib/session";

/** Removes a public job from the site (e.g. spam, scam, wrong or expired). Users' tracked applications keep their copy. */
export async function deleteJob(jobId: string): Promise<{ ok: boolean; message: string }> {
  try {
    const admin = await requireAdminAction();
    const id = z.string().uuid().parse(jobId);
    const [job] = await db.select({ title: schema.jobs.title, company: schema.jobs.company }).from(schema.jobs).where(and(eq(schema.jobs.id, id), isNull(schema.jobs.ownerUserId)));
    if (!job) return { ok: false, message: "Job not found." };
    await db.delete(schema.jobs).where(eq(schema.jobs.id, id));
    await db.insert(schema.auditLogs).values({ actorId: admin.user.id, action: "job.delete", target: `${job.title} @ ${job.company}`.slice(0, 200) });
    revalidatePath("/admin/jobs");
    return { ok: true, message: "Job removed." };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." };
  }
}
