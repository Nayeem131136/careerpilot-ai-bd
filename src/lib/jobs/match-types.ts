import { z } from "zod";

const str = (n: number) => z.string().trim().max(n);
export const matchSchema = z.object({
  score: z.coerce.number().int().min(0).max(100),
  verdict: z.enum(["strong", "good", "partial", "weak"]).catch("partial"),
  summary: str(500),
  strengths: z.array(str(220)).max(5).default([]),
  gaps: z.array(str(220)).max(5).default([]),
  missingSkills: z.array(str(60)).max(8).default([]),
  tips: z.array(str(240)).max(4).default([]),
});
export type MatchResult = z.infer<typeof matchSchema>;

