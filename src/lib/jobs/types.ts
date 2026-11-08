export type NormalizedJob = {
  source: string;
  externalId: string;
  title: string;
  company: string;
  location: string | null;
  country: string | null;
  remote: boolean | null;
  jobType: string | null;
  level: string | null;
  description: string;
  url: string;
  postedAt: Date | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  tags: string[];
  sector?: string | null;
  workMode?: string | null;
  deadline?: string | null;
};

export const SOURCE_LABELS: Record<string, { label: string; url: string }> = {
  jobicy: { label: "Jobicy", url: "https://jobicy.com" },
  arbeitnow: { label: "Arbeitnow", url: "https://www.arbeitnow.com" },
  adzuna: { label: "Adzuna", url: "https://www.adzuna.com" },
  jooble: { label: "Jooble", url: "https://jooble.org" },
  greenhouse: { label: "Greenhouse (company board)", url: "https://www.greenhouse.com" },
  lever: { label: "Lever (company board)", url: "https://www.lever.co" },
  pasted: { label: "Added by you", url: "" },
  curated: { label: "Added by CareerPilot", url: "" },
  notice: { label: "Official notice", url: "" },
};
