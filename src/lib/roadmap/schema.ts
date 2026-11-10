import { z } from "zod";

const str = (n: number) => z.string().trim().max(n);
export const roadmapSchema = z.object({
  summary: str(700),
  targetRole: str(120),
  totalWeeks: z.coerce.number().int().min(1).max(52),
  phases: z.array(z.object({
    title: str(120), weeks: str(40), goal: str(320),
    skills: z.array(str(60)).max(6).default([]),
    actions: z.array(str(280)).max(6).default([]),
    resources: z.array(z.object({
      name: str(140), kind: z.enum(["course", "book", "docs", "practice", "community", "other"]).catch("other"), searchQuery: str(140).default(""),
    })).max(4).default([]),
  })).min(1).max(5),
  quickWins: z.array(str(260)).max(5).default([]),
  projectIdeas: z.array(z.object({ title: str(120), description: str(320), skills: z.array(str(50)).max(6).default([]) })).max(3).default([]),
  honestNote: str(400).default(""),
});
export type Roadmap = z.infer<typeof roadmapSchema>;
export const HOURS = [3, 5, 10, 15, 20] as const;
export const PROGRESS_KEY = /^(a-\d{1,2}-\d{1,2}|p-\d{1,2}|q-\d{1,2})$/;
export function itemKeys(r: Roadmap): string[] {
  return [
    ...r.phases.flatMap((ph, i) => ph.actions.map((_, j) => `a-${i}-${j}`)),
    ...r.projectIdeas.map((_, i) => `p-${i}`),
    ...r.quickWins.map((_, i) => `q-${i}`),
  ];
}
