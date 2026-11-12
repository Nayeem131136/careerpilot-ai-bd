import { getDeadlines } from "@/lib/deadlines/data";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const day = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "");

/** A calendar file (.ics) of the user's upcoming deadlines. Phone/desktop calendars add the reminders (7 days and 1 day before). */
export async function GET() {
  const s = await getSession();
  if (!s) return new Response("Please sign in.", { status: 401 });
  const items = (await getDeadlines(s.user.id)).filter((i) => i.date && (i.days ?? -1) >= 0);
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//CareerPilot AI//Deadlines//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:CareerPilot deadlines"];
  for (const i of items) {
    const end = new Date((i.date as Date).getTime() + 86_400_000);
    lines.push("BEGIN:VEVENT", `UID:${i.key}@careerpilot`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${day(i.date as Date)}`, `DTEND;VALUE=DATE:${day(end)}`,
      `SUMMARY:${esc(`Deadline: ${i.title}`.slice(0, 120))}`, `DESCRIPTION:${esc(`${i.sub}${i.external ? `\n${i.external}` : ""}\nCheck the official page for the exact closing time.`)}`,
      "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Deadline in 7 days", "TRIGGER:-P7D", "END:VALARM", "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Deadline tomorrow", "TRIGGER:-P1D", "END:VALARM", "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return new Response(lines.join("\r\n") + "\r\n", { headers: { "content-type": "text/calendar; charset=utf-8", "content-disposition": 'attachment; filename="careerpilot-deadlines.ics"', "cache-control": "no-store" } });
}
