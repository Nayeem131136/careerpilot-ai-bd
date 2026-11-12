import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { daysLeft, parseDeadline } from "./parse";

export type DeadlineItem = {
  key: string; kind: "application" | "scholarship"; id: string; title: string; sub: string; date: Date | null; rawText: string | null; days: number | null;
  href: string; external: string | null;
};

/** Open applications (not yet applied) and saved scholarships, with a date when one can be read. */
export async function getDeadlines(userId: string): Promise<DeadlineItem[]> {
  const now = new Date();
  const [apps, schols] = await Promise.all([
    db.select().from(schema.applications).where(and(eq(schema.applications.userId, userId), inArray(schema.applications.status, ["interested", "drafting"]))),
    db.select({ s: schema.scholarships }).from(schema.scholarshipSaves).innerJoin(schema.scholarships, eq(schema.scholarships.id, schema.scholarshipSaves.scholarshipId))
      .where(and(eq(schema.scholarshipSaves.userId, userId), eq(schema.scholarships.status, "published"))),
  ]);
  const items: DeadlineItem[] = [];
  for (const a of apps) {
    const date = parseDeadline(a.deadline);
    items.push({ key: `a-${a.id}`, kind: "application", id: a.id, title: a.jobTitle, sub: a.company, date, rawText: a.deadline, days: date ? daysLeft(date, now) : null, href: `/dashboard/applications/${a.id}`, external: a.jobUrl });
  }
  for (const { s } of schols) {
    const date = s.deadlineDate ?? parseDeadline(s.deadlineText);
    items.push({ key: `s-${s.id}`, kind: "scholarship", id: s.id, title: s.name, sub: s.hostCountry, date, rawText: s.deadlineText || null, days: date ? daysLeft(date, now) : null, href: `/dashboard/scholarships?saved=1`, external: s.officialUrl });
  }
  return items.sort((x, y) => (x.days ?? 1e9) - (y.days ?? 1e9));
}
