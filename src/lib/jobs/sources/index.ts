import "server-only";
import { fetchJson } from "../http";
import type { NormalizedJob } from "../types";
import { classifySector, classifyWorkMode, htmlToText, inferCountry, looksRemote, num, safeUrl, str, strList, toDate } from "../util";

type Rec = Record<string, unknown>;
const rec = (v: unknown): Rec => (v && typeof v === "object" ? (v as Rec) : {});
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

function build(p: Omit<NormalizedJob, "country" | "remote" | "tags"> & { country?: string | null; remote?: boolean | null; tags?: string[] }): NormalizedJob | null {
  if (!p.title || !p.company || !p.url || !p.externalId) return null;
  const remote = p.remote ?? (looksRemote(p.location, p.title) || null);
  return {
    ...p, country: p.country ?? inferCountry(p.location), remote, tags: (p.tags ?? []).slice(0, 15), description: p.description,
    sector: p.sector ?? classifySector(p.company), workMode: p.workMode ?? classifyWorkMode(remote, p.location, p.title, p.description.slice(0, 600)),
  };
}

/* ---------- Jobicy (free, no key). Rules: cache >= 1h, keep source link + attribution. ---------- */
export function normalizeJobicy(json: unknown): NormalizedJob[] {
  return arr(rec(json).jobs).map((x) => {
    const j = rec(x);
    const geo = strList(j.jobGeo).join(", ");
    return build({
      source: "jobicy", externalId: str(j.id, 60), title: str(j.jobTitle, 200), company: str(j.companyName, 150),
      location: geo || "Remote", remote: true, jobType: strList(j.jobType).join(", ") || null, level: str(j.jobLevel, 40) || null,
      description: htmlToText(j.jobDescription || j.jobExcerpt), url: safeUrl(j.url) ?? "", postedAt: toDate(j.pubDate),
      salaryMin: num(j.salaryMin), salaryMax: num(j.salaryMax), salaryCurrency: str(j.salaryCurrency, 5) || null,
      tags: strList(j.jobIndustry), country: inferCountry(geo),
    });
  }).filter((x): x is NormalizedJob => x !== null);
}
export async function fetchJobicy(): Promise<NormalizedJob[]> {
  return normalizeJobicy(await fetchJson("https://jobicy.com/api/v2/remote-jobs?count=100"));
}

/* ---------- Arbeitnow (free, no key; Europe-focused, many visa-sponsoring roles) ---------- */
export function normalizeArbeitnow(json: unknown): NormalizedJob[] {
  return arr(rec(json).data).map((x) => {
    const j = rec(x);
    const loc = str(j.location, 150);
    return build({
      source: "arbeitnow", externalId: str(j.slug, 200), title: str(j.title, 200), company: str(j.company_name, 150),
      location: loc || null, remote: typeof j.remote === "boolean" ? j.remote : null, jobType: strList(j.job_types).join(", ") || null, level: null,
      description: htmlToText(j.description), url: safeUrl(j.url) ?? "", postedAt: toDate(j.created_at),
      salaryMin: null, salaryMax: null, salaryCurrency: null, tags: strList(j.tags),
    });
  }).filter((x): x is NormalizedJob => x !== null);
}
export async function fetchArbeitnow(): Promise<NormalizedJob[]> {
  const out: NormalizedJob[] = [];
  for (const page of [1, 2]) out.push(...normalizeArbeitnow(await fetchJson(`https://www.arbeitnow.com/api/job-board-api?page=${page}`)));
  return out;
}

/* ---------- Adzuna (free key; no Bangladesh coverage) ---------- */
export const ADZUNA_COUNTRIES: Record<string, string> = {
  "United Kingdom": "gb", "United States": "us", Australia: "au", Canada: "ca", Germany: "de", France: "fr", Netherlands: "nl",
  "New Zealand": "nz", Singapore: "sg", India: "in",
};
export function normalizeAdzuna(json: unknown, countryName: string): NormalizedJob[] {
  return arr(rec(json).results).map((x) => {
    const j = rec(x);
    const loc = str(rec(j.location).display_name, 150);
    return build({
      source: "adzuna", externalId: str(j.id, 80), title: htmlToText(j.title, 200), company: str(rec(j.company).display_name, 150),
      location: loc || null, country: countryName, jobType: str(j.contract_type, 30) || null, level: null,
      description: htmlToText(j.description), url: safeUrl(j.redirect_url) ?? "", postedAt: toDate(j.created),
      salaryMin: num(j.salary_min), salaryMax: num(j.salary_max), salaryCurrency: null,
    });
  }).filter((x): x is NormalizedJob => x !== null);
}
export async function fetchAdzuna(id: string, key: string, country: string, what: string): Promise<NormalizedJob[]> {
  const cc = ADZUNA_COUNTRIES[country];
  if (!cc) return [];
  const q = new URLSearchParams({ app_id: id, app_key: key, results_per_page: "30", what, "content-type": "application/json" });
  return normalizeAdzuna(await fetchJson(`https://api.adzuna.com/v1/api/jobs/${cc}/search/1?${q}`), country);
}

/* ---------- Jooble (free key; includes many countries, check coverage in the admin panel) ---------- */
export function normalizeJooble(json: unknown, country?: string): NormalizedJob[] {
  return arr(rec(json).jobs).map((x) => {
    const j = rec(x);
    const loc = str(j.location, 150);
    return build({
      source: "jooble", externalId: str(j.id, 80) || str(j.link, 80), title: htmlToText(j.title, 200), company: str(j.company, 150) || str(j.source, 100),
      location: loc || null, jobType: str(j.type, 30) || null, level: null, description: htmlToText(j.snippet),
      url: safeUrl(j.link) ?? "", postedAt: toDate(j.updated), salaryMin: null, salaryMax: null, salaryCurrency: null,
      country: country ?? undefined,
    });
  }).filter((x): x is NormalizedJob => x !== null);
}
export async function fetchJooble(key: string, keywords: string, location: string, country?: string): Promise<NormalizedJob[]> {
  if (!/^[\w-]{8,80}$/.test(key)) throw new Error("invalid key format");
  return normalizeJooble(await fetchJson(`https://jooble.org/api/${key}`, { method: "POST", body: { keywords, location, page: 1 } }), country);
}

/* ---------- Company boards (public ATS APIs) ---------- */
const TOKEN = /^[a-z0-9][a-z0-9_-]{0,59}$/i;
export const validToken = (t: string) => TOKEN.test(t);

export function normalizeGreenhouse(json: unknown, name: string, token: string): NormalizedJob[] {
  return arr(rec(json).jobs).map((x) => {
    const j = rec(x);
    const loc = str(rec(j.location).name, 150);
    return build({
      source: "greenhouse", externalId: `${token}:${str(j.id, 40)}`, title: str(j.title, 200), company: name, location: loc || null, jobType: null, level: null,
      description: htmlToText(j.content), url: safeUrl(j.absolute_url) ?? "", postedAt: toDate(j.first_published ?? j.updated_at),
      salaryMin: null, salaryMax: null, salaryCurrency: null,
    });
  }).filter((x): x is NormalizedJob => x !== null);
}
export async function fetchGreenhouse(name: string, token: string) {
  if (!validToken(token)) throw new Error("invalid board token");
  return normalizeGreenhouse(await fetchJson(`https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=true`), name, token);
}

export function normalizeLever(json: unknown, name: string, token: string): NormalizedJob[] {
  return arr(json).map((x) => {
    const j = rec(x); const c = rec(j.categories);
    const loc = str(c.location, 150);
    return build({
      source: "lever", externalId: `${token}:${str(j.id, 60)}`, title: str(j.text, 200), company: name, location: loc || null,
      remote: str(j.workplaceType, 20).toLowerCase() === "remote" ? true : null, jobType: str(c.commitment, 40) || null, level: null,
      description: htmlToText(j.descriptionPlain ?? j.description), url: safeUrl(j.hostedUrl) ?? "", postedAt: toDate(j.createdAt),
      salaryMin: null, salaryMax: null, salaryCurrency: null,
    });
  }).filter((x): x is NormalizedJob => x !== null);
}
export async function fetchLever(name: string, token: string) {
  if (!validToken(token)) throw new Error("invalid board token");
  return normalizeLever(await fetchJson(`https://api.lever.co/v0/postings/${token}?mode=json`), name, token);
}
