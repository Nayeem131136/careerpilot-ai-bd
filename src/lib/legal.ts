/** Operator details for the legal pages. Set these in Vercel (Config): LEGAL_OWNER_NAME, LEGAL_COUNTRY, LEGAL_CONTACT_EMAIL. */
const clean = (v: string | undefined) => (v ?? "").trim().slice(0, 200);
export const legal = {
  owner: clean(process.env.LEGAL_OWNER_NAME),
  country: clean(process.env.LEGAL_COUNTRY),
  email: clean(process.env.LEGAL_CONTACT_EMAIL),
  updated: "10 November 2026",
};
export const legalComplete = Boolean(legal.owner && legal.country && legal.email);
