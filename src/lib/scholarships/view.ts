import { STALE_DAYS, levelLabel } from "./types";

export type Row = {
  id: string; name: string; provider: string; hostCountry: string; universities: string[]; levels: string[]; fields: string[]; funding: string;
  coverage: string; eligibility: string; bangladeshEligible: string; language: string; howToApply: string; deadlineText: string;
  deadlineDate: Date | null; officialUrl: string; lastVerifiedAt: Date | null; checkStatus: string | null;
};

export type CardData = Omit<Row, "deadlineDate" | "lastVerifiedAt" | "levels"> & { levels: string[]; deadline: string; deadlineState: "open" | "passed" | "text"; verified: "fresh" | "stale" | "never"; verifiedOn: string | null; flagged: "changed" | "broken" | null };

const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export function toCard(r: Row, now = new Date()): CardData {
  const { deadlineDate, lastVerifiedAt, ...rest } = r;
  const age = lastVerifiedAt ? (now.getTime() - lastVerifiedAt.getTime()) / 86_400_000 : null;
  let deadline = r.deadlineText, state: CardData["deadlineState"] = "text";
  if (deadlineDate) { state = deadlineDate.getTime() + 86_400_000 >= now.getTime() ? "open" : "passed"; deadline = state === "open" ? fmt(deadlineDate) : `${fmt(deadlineDate)} (passed: check for the next round)`; }
  return {
    ...rest, levels: r.levels.map(levelLabel), deadline, deadlineState: state,
    verified: age === null ? "never" : age > STALE_DAYS ? "stale" : "fresh", verifiedOn: lastVerifiedAt ? fmt(lastVerifiedAt) : null,
    flagged: r.checkStatus === "changed" ? "changed" : r.checkStatus === "broken" ? "broken" : null,
  };
}
