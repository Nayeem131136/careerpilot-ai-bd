export const STATUSES = ["interested", "drafting", "applied", "interview", "offer", "rejected", "withdrawn"] as const;
export type AppStatus = (typeof STATUSES)[number];
export const STATUS_LABEL: Record<AppStatus, string> = {
  interested: "Interested", drafting: "Preparing", applied: "Applied", interview: "Interview", offer: "Offer", rejected: "Rejected", withdrawn: "Withdrawn",
};
export const KINDS = ["cover_letter", "email"] as const;
export type DraftKind = (typeof KINDS)[number];
export const TONES = ["professional", "friendly", "concise"] as const;
export type Tone = (typeof TONES)[number];
