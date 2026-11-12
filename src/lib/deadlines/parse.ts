const MONTHS: Record<string, number> = { jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9, september: 9, oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12 };
const MON = "(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";

function utc(y: number, m: number, d: number): Date | null {
  if (y < 2000 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d ? dt : null;
}

/**
 * Finds a calendar date inside free text such as "2026-12-31", "31 December 2026", "Dec 31, 2026", "31/12/2026".
 * Numeric day/month/year is read day-first (the usual order in Bangladesh). Returns null when there is no full date (a year is required).
 */
export function parseDeadline(text: string | null | undefined): Date | null {
  if (!text) return null;
  const t = text.toLowerCase();
  let m = t.match(/\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
  if (m) return utc(+m[1], +m[2], +m[3]);
  m = t.match(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?[\\s,.-]+(?:of\\s+)?${MON}\\.?[\\s,.-]+(20\\d{2})\\b`));
  if (m) return utc(+m[3], MONTHS[m[2]], +m[1]);
  m = t.match(new RegExp(`\\b${MON}\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(20\\d{2})\\b`));
  if (m) return utc(+m[3], MONTHS[m[1]], +m[2]);
  m = t.match(/\b(\d{1,2})[/.-](\d{1,2})[/.-](20\d{2})\b/);
  if (m) return utc(+m[3], +m[2], +m[1]);
  return null;
}

export const isoDay = (d: Date) => d.toISOString().slice(0, 10);

/** Whole calendar days from today (UTC date) to the deadline. Negative = passed. */
export function daysLeft(deadline: Date, now = new Date()): number {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((deadline.getTime() - today) / 86_400_000);
}

export function whenLabel(n: number): string {
  if (n < 0) return `${-n} day${n === -1 ? "" : "s"} ago`;
  if (n === 0) return "Today";
  if (n === 1) return "Tomorrow";
  return `${n} days left`;
}
