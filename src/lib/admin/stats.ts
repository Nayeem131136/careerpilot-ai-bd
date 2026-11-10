import "server-only";
import { and, count, desc, eq, gte, isNull, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export const days = (n: number) => new Date(Date.now() - n * 86_400_000);

export async function overview() {
  const one = async <T,>(q: Promise<T[]>) => (await q)[0];
  const [users, newUsers, cvs, apps, pubJobs, ai24, ai24fail, ai7] = await Promise.all([
    one(db.select({ n: count() }).from(schema.user)),
    one(db.select({ n: count() }).from(schema.user).where(gte(schema.user.createdAt, days(7)))),
    one(db.select({ n: count() }).from(schema.cvs).where(eq(schema.cvs.status, "analyzed"))),
    one(db.select({ n: count() }).from(schema.applications)),
    one(db.select({ n: count() }).from(schema.jobs).where(isNull(schema.jobs.ownerUserId))),
    one(db.select({ n: count() }).from(schema.aiUsage).where(gte(schema.aiUsage.createdAt, days(1)))),
    one(db.select({ n: count() }).from(schema.aiUsage).where(and(gte(schema.aiUsage.createdAt, days(1)), eq(schema.aiUsage.ok, false)))),
    one(db.select({ n: count() }).from(schema.aiUsage).where(gte(schema.aiUsage.createdAt, days(7)))),
  ]);
  const byTask = await db.select({ task: schema.aiUsage.task, calls: count(), failed: sql<number>`count(*) filter (where ${schema.aiUsage.ok} = false)`.mapWith(Number) })
    .from(schema.aiUsage).where(gte(schema.aiUsage.createdAt, days(7))).groupBy(schema.aiUsage.task).orderBy(desc(count()));
  const topErrors = await db.select({ error: schema.aiUsage.error, n: count() }).from(schema.aiUsage)
    .where(and(gte(schema.aiUsage.createdAt, days(7)), eq(schema.aiUsage.ok, false))).groupBy(schema.aiUsage.error).orderBy(desc(count())).limit(3);
  const recent = await db.select({ action: schema.auditLogs.action, target: schema.auditLogs.target, at: schema.auditLogs.createdAt, who: schema.user.email })
    .from(schema.auditLogs).leftJoin(schema.user, eq(schema.user.id, schema.auditLogs.actorId)).orderBy(desc(schema.auditLogs.createdAt)).limit(12);
  return { users: users.n, newUsers: newUsers.n, cvs: cvs.n, apps: apps.n, pubJobs: pubJobs.n, ai24: ai24.n, ai24fail: ai24fail.n, ai7: ai7.n, byTask, topErrors, recent };
}
