import { LEVEL_KEYS, cleanUrl, scholarshipInput, toList, type ScholarshipInput } from "./types";

export type Parsed = {
  name: string; provider: string; hostCountry: string; universities: string; levels: string[]; fields: string; funding: "full" | "partial";
  coverage: string; eligibility: string; bangladeshEligible: "yes" | "check"; language: string; howToApply: string; deadlineText: string; deadlineDate: string; officialUrl: string;
};

const LABELS: [keyof Parsed | "skip", RegExp][] = [
  ["name", /^(scholarship\s+)?name/i], ["provider", /^provider/i], ["hostCountry", /^(country|host country)/i], ["universities", /^universit/i],
  ["levels", /^level/i], ["fields", /^fields?\b/i], ["funding", /^funding/i], ["coverage", /^(what it covers|coverage|benefits)/i],
  ["eligibility", /^(who can apply|eligibility)/i], ["bangladeshEligible", /^bangladesh/i], ["language", /^language/i], ["howToApply", /^how to apply/i],
  ["deadlineText", /^deadline text/i], ["deadlineDate", /^deadline date/i], ["officialUrl", /^(official link|official url|link)/i], ["skip", /^(where i confirmed|source|checked|confirmed)/i],
];

/** Removes chat-assistant artefacts: citation markers, markdown bold/links, bullets. */
function tidy(s: string): string {
  return s
    .replace(/[-]/g, "").replace(/cite(turn\d+\w+\d+)+/gi, "").replace(/【[^】]*】/g, "")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, "$2")
    .replace(/\*\*|__/g, "").replace(/\s+/g, " ").trim();
}
const unconfirmed = (s: string) => !s || /^(not confirmed|n\/a|none|-|—|unknown)\.?$/i.test(s.trim());

/** Reads one scholarship written in the "Label: value" format and maps it to the form. Returns null if nothing usable is found. */
export function parseScholarshipText(raw: string): { data: Partial<Parsed>; filled: number } | null {
  const lines = raw.replace(/\r/g, "").split("\n");
  const got: Record<string, string> = {};
  let cur: string | null = null;
  for (const ln of lines) {
    const m = ln.replace(/^[\s>*\-•\d.)]*\**/, "").match(/^([A-Za-z][A-Za-z '’\/()\-"“”,.]{1,70}?)\**\s*:\s*\**(.*)$/);
    const hit = m ? LABELS.find(([, re]) => re.test(m[1].trim())) : undefined;
    if (hit && m) { cur = hit[0] as string; got[cur] = ((got[cur] ?? "") + " " + m[2]).trim(); }
    else if (cur && ln.trim()) got[cur] = (got[cur] + " " + ln.trim()).trim();
  }
  const g = (k: string) => { const v = tidy(got[k] ?? ""); return unconfirmed(v) ? "" : v; };
  const d: Partial<Parsed> = {};
  const set = <K extends keyof Parsed>(k: K, v: Parsed[K]) => { if (Array.isArray(v) ? v.length : v) d[k] = v; };

  set("name", g("name").slice(0, 160)); set("provider", g("provider").slice(0, 160)); set("hostCountry", g("hostCountry").slice(0, 80));
  const list = (s: string) => [...new Set(s.split(/[,;·]/).map((x) => x.trim()).filter((x) => x && !/^(all|any|various|many)\b/i.test(x)))].join(", ");
  set("universities", list(g("universities")).slice(0, 600));
  const lv = g("levels").toLowerCase();
  const levels = [/hsc|school|higher secondary|a-?level/.test(lv) && "hsc", /bachelor|undergrad|b\.?sc|\bbs\b|\bba\b/.test(lv) && "bachelor", /master|msc|m\.sc|postgrad|\bma\b|\bmba\b/.test(lv) && "master", /phd|ph\.d|doctor/.test(lv) && "phd"].filter(Boolean) as string[];
  set("levels", levels.filter((l) => (LEVEL_KEYS as string[]).includes(l)));
  set("fields", /^(all|any)\b/i.test(g("fields")) ? "" : list(g("fields")));
  const fu = g("funding").toLowerCase();
  if (fu) d.funding = /partial|part\b|some|contribut/.test(fu) ? "partial" : /full/.test(fu) ? "full" : "partial";
  set("coverage", g("coverage").slice(0, 700)); set("eligibility", g("eligibility").slice(0, 900));
  const bd = g("bangladeshEligible").toLowerCase();
  d.bangladeshEligible = /^yes\b/.test(bd) && !/not confirmed|unclear|check/.test(bd) ? "yes" : "check";
  set("language", g("language").slice(0, 200)); set("howToApply", g("howToApply").slice(0, 900)); set("deadlineText", g("deadlineText").slice(0, 200));
  const dd = (g("deadlineDate") + " " + g("deadlineText")).match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (dd) d.deadlineDate = dd[1];
  const urlTxt = (got["officialUrl"] ?? "").replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, "$2");
  const um = urlTxt.match(/https?:\/\/[^\s<>"')\]]+/);
  if (um) d.officialUrl = cleanUrl(um[0]);
  const filled = Object.keys(d).filter((k) => k !== "bangladeshEligible" || got["bangladeshEligible"]).length;
  return filled >= 2 ? { data: d, filled } : null;
}

/** Splits a pasted text that holds several scholarships (each starts with a "Name:" line). One block if there is no such line. */
export function splitBlocks(raw: string): string[] {
  const lines = raw.replace(/\r/g, "").split("\n");
  const starts: number[] = [];
  lines.forEach((l, i) => { if (/^[\s>*\-•\d.)#]*\**\s*(scholarship\s+)?name\**\s*:/i.test(l)) starts.push(i); });
  if (starts.length <= 1) return raw.trim() ? [raw] : [];
  return starts.map((s, k) => lines.slice(s, starts[k + 1] ?? lines.length).join("\n")).filter((b) => b.trim());
}

const FIELD_LABEL: Record<string, string> = { name: "name", provider: "provider", hostCountry: "country of study", levels: "levels", officialUrl: "official link" };

export type Candidate = { ok: true; input: ScholarshipInput } | { ok: false; name: string; issues: string[] };

/** Turns one pasted block into a validated scholarship, or lists exactly what is missing. */
export function toCandidate(block: string): Candidate {
  const r = parseScholarshipText(block);
  if (!r) return { ok: false, name: "(unreadable)", issues: ["no “Label: value” lines found"] };
  const d = r.data;
  const v = scholarshipInput.safeParse({
    name: d.name ?? "", provider: d.provider ?? "", hostCountry: d.hostCountry ?? "", universities: toList(d.universities ?? ""), levels: d.levels ?? [], fields: toList(d.fields ?? ""),
    funding: d.funding ?? "partial", coverage: d.coverage ?? "", eligibility: d.eligibility ?? "", bangladeshEligible: d.bangladeshEligible ?? "check", language: d.language ?? "",
    howToApply: d.howToApply ?? "", deadlineText: d.deadlineText ?? "", deadlineDate: d.deadlineDate ?? "", officialUrl: d.officialUrl ?? "",
  });
  if (v.success) return { ok: true, input: v.data };
  const issues = [...new Set(v.error.issues.map((i) => { const k = String(i.path[0] ?? ""); return FIELD_LABEL[k] ? `${FIELD_LABEL[k]} missing or invalid` : `${k}: ${i.message}`; }))];
  return { ok: false, name: d.name || "(no name)", issues };
}
