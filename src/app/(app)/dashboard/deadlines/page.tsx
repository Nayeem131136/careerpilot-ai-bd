import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { DeadlineRow } from "@/components/app/deadline-row";
import { Card, EmptyState } from "@/components/ui/primitives";
import { getDeadlines } from "@/lib/deadlines/data";
import { requireSession } from "@/lib/session";

export const metadata = { title: "Deadlines" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const s = await requireSession();
  const all = await getDeadlines(s.user.id);
  const overdue = all.filter((i) => i.days !== null && i.days < 0);
  const soon = all.filter((i) => i.days !== null && i.days >= 0 && i.days <= 7);
  const later = all.filter((i) => i.days !== null && i.days > 7);
  const none = all.filter((i) => i.days === null);
  const group = (title: string, list: typeof all, hint?: string) => list.length > 0 && (
    <section className="space-y-2"><h2 className="font-display text-lg font-bold">{title} <span className="text-sm font-normal text-muted">({list.length})</span></h2>{hint && <p className="text-sm text-muted">{hint}</p>}<ul className="space-y-2">{list.map((i) => <DeadlineRow key={i.key} i={i} />)}</ul></section>
  );
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-extrabold">Deadlines</h1><p className="mt-1 text-sm text-muted">Jobs you are preparing (not yet marked applied) and scholarships you saved, closest first.</p></div>
        <a href="/api/deadlines/ics" className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:border-primary/60"><CalendarClock size={16} aria-hidden="true" />Add to my calendar (.ics)</a>
      </div>
      <Card className="p-4 text-sm text-muted">Open the calendar file on your phone or computer and your own calendar app will remind you <b className="text-fg">7 days and 1 day before</b> each date. Download it again after you add new items. Dates come from the job or scholarship page and can be wrong or change: always confirm on the official page. You can set your own date on any application.</Card>
      {all.length === 0 && <EmptyState title="No deadlines yet">Save a scholarship (bookmark) or press “Prepare application” on a job. Their deadlines will show up here.</EmptyState>}
      {group("Passed", overdue, "These dates have passed. If you did not apply, check whether there is a next round, or remove them.")}
      {group("Next 7 days", soon)}
      {group("Later", later)}
      {group("No date found", none, "We could not read a date. Open the item and set your own deadline, or check the official page.")}
      {all.length > 0 && <p className="text-xs text-muted">Applications you mark <b>Applied</b> leave this list. <Link href="/dashboard/applications" className="text-primary hover:underline">Open applications</Link></p>}
    </div>
  );
}
