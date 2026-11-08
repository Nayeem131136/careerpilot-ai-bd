import { createHash } from "node:crypto";

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", hellip: "…", bull: "•" };

export function decodeEntities(s: string): string {
  return s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const n = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

/** HTML (possibly entity-escaped, as Greenhouse returns) to safe plain text. We never render source HTML. */
export function htmlToText(input: unknown, max = 8000): string {
  let s = typeof input === "string" ? input : "";
  if (/&lt;\w+/i.test(s) && !/<\w+/.test(s)) s = decodeEntities(s); // escaped HTML
  s = s.replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\s*(br|\/p|\/div|\/li|\/h[1-6]|\/tr)\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, " ");
  s = decodeEntities(s).replace(/[ \t ]+/g, " ").replace(/ ?\n ?/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  return s.slice(0, max);
}

export const str = (v: unknown, max = 300): string => (typeof v === "string" ? v.trim().slice(0, max) : typeof v === "number" ? String(v) : "");
export const strList = (v: unknown): string[] => (Array.isArray(v) ? v.map((x) => str(x, 60)).filter(Boolean) : str(v, 60) ? [str(v, 60)] : []);
export const num = (v: unknown): number | null => { const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN; return Number.isFinite(n) && n >= 0 && n < 1e10 ? Math.round(n) : null; };

/** Only http(s) links are ever stored, so a hostile feed cannot inject javascript: URLs. */
export function safeUrl(v: unknown): string | null {
  const s = str(v, 1000);
  try { const u = new URL(s); return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null; } catch { return null; }
}

export function toDate(v: unknown): Date | null {
  if (v == null || v === "") return null;
  const d = typeof v === "number" ? new Date(v < 1e12 ? v * 1000 : v) : new Date(String(v));
  return Number.isNaN(d.getTime()) || d.getFullYear() < 2000 || d.getTime() > Date.now() + 864e5 * 2 ? null : d;
}

const COUNTRY_HINTS: [string, RegExp][] = [
  ["Bangladesh", /bangladesh|dhaka|chattogram|chittagong|sylhet|khulna|rajshahi|gazipur|narayanganj/i],
  ["Australia", /australia|sydney|melbourne|brisbane|perth|adelaide|canberra/i],
  ["United Kingdom", /united kingdom|\buk\b|england|london|manchester|scotland|wales|edinburgh/i],
  ["United States", /united states|\busa?\b|new york|san francisco|california|texas|seattle|chicago|boston/i],
  ["Canada", /canada|toronto|vancouver|montreal|ottawa/i],
  ["Germany", /germany|deutschland|berlin|munich|münchen|hamburg|frankfurt|köln|cologne/i],
  ["Netherlands", /netherlands|amsterdam|rotterdam|utrecht/i],
  ["Ireland", /ireland|dublin/i],
  ["New Zealand", /new zealand|auckland|wellington/i],
  ["Singapore", /singapore/i],
  ["Malaysia", /malaysia|kuala lumpur/i],
  ["United Arab Emirates", /united arab emirates|\buae\b|dubai|abu dhabi/i],
  ["Saudi Arabia", /saudi|riyadh|jeddah/i],
  ["Qatar", /qatar|doha/i],
  ["India", /india|bengaluru|bangalore|mumbai|delhi|hyderabad|pune|chennai/i],
  ["Japan", /japan|tokyo|osaka/i],
  ["France", /france|paris/i],
];
export function inferCountry(location: string | null | undefined): string | null {
  if (!location) return null;
  for (const [c, re] of COUNTRY_HINTS) if (re.test(location)) return c;
  return null;
}
export const looksRemote = (...parts: (string | null | undefined)[]) => /remote|work from home|anywhere|wfh/i.test(parts.filter(Boolean).join(" "));

export function dedupeKey(title: string, company: string, country: string | null) {
  const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  return createHash("sha1").update(`${norm(title)}|${norm(company)}|${norm(country ?? "")}`).digest("hex");
}

const GOVT = /ministry|division\b|directorate|department of|bpsc|public service commission|bangladesh bank|government|govt\b|upazila|zila parishad|municipal|city corporation|bangladesh (police|army|navy|railway|biman)|teletalk|মন্ত্রণালয়|অধিদপ্তর|অধিদফতর|পরিষদ|সরকারি|কমিশন/i;
export function classifySector(company: string, extra = ""): "government" | "private" {
  return GOVT.test(`${company} ${extra}`) ? "government" : "private";
}
export function classifyWorkMode(remote: boolean | null | undefined, ...parts: (string | null | undefined)[]): "onsite" | "hybrid" | "remote" | "home" | null {
  const t = parts.filter(Boolean).join(" ");
  if (/work from home|home[- ]?office|home[- ]?based|\bwfh\b|বাসা থেকে|ঘরে বসে/i.test(t)) return "home";
  if (/hybrid/i.test(t)) return "hybrid";
  if (remote || /\bremote\b|anywhere/i.test(t)) return "remote";
  return t.trim() ? "onsite" : null;
}
