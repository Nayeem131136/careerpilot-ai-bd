/** Deterministic, explainable relevance used for ordering the feed. (AI-written match explanations come in Phase 5.) */
export type RankProfile = {
  roles: string[]; skills: string[]; countries: string[]; arrangements: string[];
  level: string | null; hasSignal: boolean;
};
export type RankJob = { title: string; description: string; country: string | null; remote: boolean | null; postedAt: Date | null };
export type Ranked = { score: number; matchedSkills: string[]; roleMatch: string | null; notes: string[] };

const STOP = new Set(["the", "and", "for", "with", "junior", "jr", "intern", "internship", "entry", "level", "developer", "engineer", "specialist"]);
const tokens = (s: string, keepGeneric = false) => s.toLowerCase().split(/[^\p{L}\p{N}+#.]+/u).filter((t) => t.length >= 2 && (keepGeneric || !STOP.has(t)));

function hasPhrase(hay: string, phrase: string) {
  const p = phrase.toLowerCase().trim();
  if (p.length < 2) return false;
  if (p.length <= 3 || /[+#.]/.test(p)) {
    const esc = p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^\\p{L}\\p{N}])${esc}($|[^\\p{L}\\p{N}])`, "iu").test(hay);
  }
  return hay.includes(p);
}

export function rankJob(job: RankJob, p: RankProfile, now = Date.now()): Ranked {
  const notes: string[] = [];
  const ageDays = job.postedAt ? (now - job.postedAt.getTime()) / 864e5 : 30;
  const fresh = ageDays <= 7 ? 1 : ageDays <= 30 ? 0.6 : 0.3;
  if (!p.hasSignal) return { score: Math.round(fresh * 100), matchedSkills: [], roleMatch: null, notes: ["Upload your CV to personalise this list"] };

  const titleTok = new Set(tokens(job.title, true));
  let title = 0; let roleMatch: string | null = null;
  for (const r of p.roles) {
    const rt = tokens(r);
    if (rt.length === 0) continue;
    const s = rt.filter((t) => titleTok.has(t)).length / rt.length;
    if (s > title) { title = s; roleMatch = r; }
  }
  const hay = `${job.title}\n${job.description}`.toLowerCase();
  const matchedSkills = p.skills.filter((s) => hasPhrase(hay, s)).slice(0, 12);
  const skillsRatio = Math.min(1, matchedSkills.length / Math.max(3, Math.min(p.skills.length, 8)));

  const wantsRemote = p.arrangements.includes("Remote") || p.countries.some((c) => c.startsWith("Remote"));
  let loc = p.countries.length === 0 && p.arrangements.length === 0 ? 0.5 : 0;
  if (job.country && p.countries.includes(job.country)) loc = 1;
  else if (job.remote && wantsRemote) loc = 1;
  else if (job.remote) loc = 0.4;

  let score = 100 * (0.4 * title + 0.35 * skillsRatio + 0.15 * loc + 0.1 * fresh);
  if ((p.level === "entry" || p.level === "student") && /\b(senior|sr\.?|lead|principal|head|director|staff|manager|vp)\b/i.test(job.title)) { score *= 0.6; notes.push("Looks more senior than your level"); }
  if (title >= 0.99 && roleMatch) notes.push(`Matches your target role "${roleMatch}"`);
  return { score: Math.round(Math.max(0, Math.min(100, score))), matchedSkills, roleMatch: title > 0.3 ? roleMatch : null, notes };
}
