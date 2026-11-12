import { desc } from "drizzle-orm";
import { ActionButton } from "@/components/admin/action-button";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Badge, Card } from "@/components/ui/primitives";
import { db, schema } from "@/lib/db";
import { clearResolved, deleteError, setErrorStatus } from "./actions";

export const metadata = { title: "Admin: errors" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const rows = await db.select().from(schema.errorLogs).orderBy(desc(schema.errorLogs.lastSeenAt)).limit(200);
  const open = rows.filter((r) => r.status === "open");
  const resolved = rows.length - open.length;
  const since = new Date().getTime() - 864e5;
  const recent = open.filter((r) => r.lastSeenAt.getTime() > since).length;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-extrabold">Errors</h1>
          <p className="mt-1 text-sm text-muted">Things that crashed for users, grouped so the same error counts once. {open.length} open ({recent} seen in the last 24 h) · {resolved} resolved. No user details are stored.</p></div>
        {resolved > 0 && <ConfirmButton label={`Clear ${resolved} resolved`} confirmText="Delete all resolved errors?" run={clearResolved} />}
      </div>
      {rows.length === 0 && <Card className="p-5 text-sm text-muted">No errors recorded. If something breaks for a user, it will show up here.</Card>}
      <div className="space-y-3">
        {rows.map((r) => (
          <Card key={r.id} className={`space-y-2 p-4 ${r.status === "resolved" ? "opacity-60" : ""}`}>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={r.status === "open" ? "danger" : "success"}>{r.status}</Badge>
              <Badge>{r.source === "server" ? "Server" : "Browser"}</Badge>
              <span className="text-sm font-semibold">{r.count}× </span>
              <code className="text-xs text-muted">{r.path || "(no path)"}{r.routeType ? ` · ${r.routeType}` : ""}</code>
            </div>
            <p className="break-words text-sm">{r.message}</p>
            <p className="text-xs text-muted">First {r.firstSeenAt.toLocaleString("en-GB")} · last {r.lastSeenAt.toLocaleString("en-GB")}{r.digest ? ` · digest ${r.digest}` : ""}</p>
            {r.stack && <details className="text-xs"><summary className="cursor-pointer text-primary">Technical details</summary><pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-lg bg-bg/60 p-3 text-muted">{r.stack}</pre></details>}
            <div className="flex flex-wrap items-center gap-4">
              {r.status === "open" ? <ActionButton label="Mark resolved" run={setErrorStatus.bind(null, r.id, "resolved")} /> : <ActionButton label="Reopen" run={setErrorStatus.bind(null, r.id, "open")} />}
              <ConfirmButton danger label="Delete" confirmText="Delete this error record?" run={deleteError.bind(null, r.id)} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
