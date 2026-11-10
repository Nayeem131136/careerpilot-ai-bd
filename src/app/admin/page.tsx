import Link from "next/link";
import { Card } from "@/components/ui/primitives";
import { overview } from "@/lib/admin/stats";

export const metadata = { title: "Admin overview" };
export const dynamic = "force-dynamic";

function Stat({ label, value, note }: { label: string; value: number | string; note?: string }) {
  return <Card className="p-4"><p className="text-xs text-muted">{label}</p><p className="mt-1 font-display text-2xl font-extrabold">{value}</p>{note && <p className="mt-0.5 text-xs text-muted">{note}</p>}</Card>;
}

export default async function Page() {
  const o = await overview();
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-extrabold">Overview</h1><p className="mt-1 text-sm text-muted">How the site is doing. <Link href="/admin/users" className="text-primary hover:underline">Users</Link> · <Link href="/admin/jobs" className="text-primary hover:underline">Jobs</Link> · <Link href="/admin/ai" className="text-primary hover:underline">AI</Link> · <Link href="/admin/sources" className="text-primary hover:underline">Job sources</Link></p></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Users" value={o.users} note={`${o.newUsers} new in 7 days`} />
        <Stat label="CVs analysed" value={o.cvs} />
        <Stat label="Applications tracked" value={o.apps} />
        <Stat label="Public jobs" value={o.pubJobs} />
        <Stat label="AI calls (24 h)" value={o.ai24} note={o.ai24fail ? `${o.ai24fail} failed` : "none failed"} />
        <Stat label="AI calls (7 days)" value={o.ai7} />
      </div>
      <Card className="space-y-3">
        <h2 className="font-display text-lg font-bold">AI usage by task (7 days)</h2>
        {o.byTask.length === 0 ? <p className="text-sm text-muted">No AI calls yet.</p> : (
          <table className="w-full text-sm"><thead><tr className="text-left text-xs text-muted"><th className="pb-1 font-medium">Task</th><th className="pb-1 font-medium">Calls</th><th className="pb-1 font-medium">Failed</th></tr></thead>
            <tbody>{o.byTask.map((t) => <tr key={t.task} className="border-t border-border"><td className="py-1.5">{t.task}</td><td>{t.calls}</td><td className={t.failed ? "text-danger" : "text-muted"}>{t.failed}</td></tr>)}</tbody></table>
        )}
        {o.topErrors.length > 0 && <div><p className="text-sm font-semibold">Most common AI errors</p><ul className="mt-1 space-y-1 text-xs text-muted">{o.topErrors.map((e, i) => <li key={i}>{e.n} × {(e.error ?? "unknown").slice(0, 140)}</li>)}</ul></div>}
      </Card>
      <Card className="space-y-3">
        <h2 className="font-display text-lg font-bold">Recent admin activity</h2>
        {o.recent.length === 0 ? <p className="text-sm text-muted">Nothing yet.</p> : (
          <ul className="space-y-1.5 text-sm">{o.recent.map((r, i) => <li key={i} className="flex flex-wrap gap-x-3 text-muted"><span className="text-xs">{r.at.toLocaleString("en-GB")}</span><span className="text-fg">{r.action}</span><span>{r.target ?? ""}</span><span className="text-xs">{r.who ? `by ${r.who}` : ""}</span></li>)}</ul>
        )}
      </Card>
    </div>
  );
}
