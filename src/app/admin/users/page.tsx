import Link from "next/link";
import { and, count, desc, gte, ilike, inArray, or } from "drizzle-orm";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Badge, Card } from "@/components/ui/primitives";
import { days } from "@/lib/admin/stats";
import { db, schema } from "@/lib/db";
import { deleteUser, setSuspended } from "./actions";

export const metadata = { title: "Admin: users" };
export const dynamic = "force-dynamic";
const PER = 25;

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 80);
  const page = Math.max(1, Math.min(1000, Number.parseInt(sp.page ?? "1", 10) || 1));
  const like = q ? `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%` : null;
  const where = like ? or(ilike(schema.user.email, like), ilike(schema.user.name, like)) : undefined;
  const [{ n: total }] = await db.select({ n: count() }).from(schema.user).where(where);
  const users = await db.select().from(schema.user).where(where).orderBy(desc(schema.user.createdAt)).limit(PER).offset((page - 1) * PER);
  const ids = users.map((u) => u.id);
  const since = days(7);
  const [cvs, apps, ai] = ids.length ? await Promise.all([
    db.select({ userId: schema.cvs.userId, status: schema.cvs.status }).from(schema.cvs).where(inArray(schema.cvs.userId, ids)),
    db.select({ userId: schema.applications.userId, n: count() }).from(schema.applications).where(inArray(schema.applications.userId, ids)).groupBy(schema.applications.userId),
    db.select({ userId: schema.aiUsage.userId, n: count() }).from(schema.aiUsage).where(and(inArray(schema.aiUsage.userId, ids), gte(schema.aiUsage.createdAt, since))).groupBy(schema.aiUsage.userId),
  ]) : [[], [], []];
  const cvBy = new Map(cvs.map((c) => [c.userId, c.status]));
  const appBy = new Map(apps.map((a) => [a.userId, a.n]));
  const aiBy = new Map(ai.map((a) => [a.userId, a.n]));
  const pages = Math.max(1, Math.ceil(total / PER));
  const link = (p: number) => `/admin/users?${new URLSearchParams({ ...(q ? { q } : {}), page: String(p) })}`;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-extrabold">Users</h1><p className="mt-1 text-sm text-muted">{total} account{total === 1 ? "" : "s"}. Suspending signs the person out and blocks access until you reactivate. Deleting removes the account and all its data for good.</p></div>
      <form className="flex gap-2" role="search">
        <input name="q" defaultValue={q} placeholder="Search name or email" aria-label="Search users" className="w-full max-w-sm rounded-xl border border-border bg-bg/60 px-3 py-2.5 text-sm outline-none focus:border-primary" />
        <button className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white">Search</button>
      </form>
      <div className="space-y-3">
        {users.map((u) => {
          const isStaff = u.role !== "user";
          return (
            <Card key={u.id} className="space-y-2 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{u.name}</span>
                <span className="text-sm text-muted">{u.email}</span>
                {isStaff && <Badge tone="warn">{u.role}</Badge>}
                {u.banned && <Badge tone="danger">Suspended</Badge>}
                {!u.emailVerified && <Badge>Email not verified</Badge>}
              </div>
              <p className="text-xs text-muted">Joined {u.createdAt.toLocaleDateString("en-GB")} · CV: {cvBy.get(u.id) ?? "none"} · {appBy.get(u.id) ?? 0} applications · {aiBy.get(u.id) ?? 0} AI calls (7 days)</p>
              {!isStaff && (
                <div className="flex flex-wrap gap-4">
                  <ConfirmButton label={u.banned ? "Reactivate" : "Suspend"} confirmText={u.banned ? `Reactivate ${u.email}?` : `Suspend ${u.email}? They will be signed out.`} run={setSuspended.bind(null, u.id, !u.banned)} />
                  <ConfirmButton danger label="Delete account" confirmText={`Permanently delete ${u.email} and all their data? This cannot be undone.`} run={deleteUser.bind(null, u.id)} />
                </div>
              )}
            </Card>
          );
        })}
        {users.length === 0 && <p className="text-sm text-muted">No users found.</p>}
      </div>
      {pages > 1 && (
        <nav className="flex items-center gap-4 text-sm" aria-label="Pages">
          {page > 1 && <Link href={link(page - 1)} className="text-primary hover:underline">← Previous</Link>}
          <span className="text-muted">Page {page} of {pages}</span>
          {page < pages && <Link href={link(page + 1)} className="text-primary hover:underline">Next →</Link>}
        </nav>
      )}
    </div>
  );
}
