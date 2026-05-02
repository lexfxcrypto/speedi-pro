// ⚠️ SYNC-WITH-WEB — If you edit this file, also update
// speedi/src/lib/certifications.ts in the web repo.
// Source of truth is web; this is a duplicate for offline availability in the native app.

/**
 * Per-trade credential suggestions — surfaced to the tradesperson when
 * they add a credential on their dashboard. Keeps the existing
 * `Credential.type` enum constraint (no schema change); custom items
 * lean on `OTHER` with a freeform `title`.
 */

// Mirrors the Prisma enum CredentialType. Inlined to avoid coupling to
// the generated client path; keep in sync with prisma/schema.prisma.
export type CredentialType =
  | "PUBLIC_LIABILITY"
  | "EMPLOYERS_LIABILITY"
  | "GAS_SAFE"
  | "NICEIC"
  | "NAPIT"
  | "CHAS"
  | "CSCS"
  | "CHECKATRADE"
  | "OTHER";

export type CertSuggestion = {
  label: string;
  enumValue: CredentialType | null;
  description?: string;
};

export type TradeCertMap = Record<string, CertSuggestion[]>;

export const TRADE_CERT_SUGGESTIONS: TradeCertMap = {
  Plumber: [
    { label: "Gas Safe Register", enumValue: "GAS_SAFE", description: "Required for all gas work" },
    { label: "WaterSafe", enumValue: "OTHER" },
    { label: "CIPHE membership", enumValue: "OTHER" },
    { label: "Public Liability Insurance", enumValue: "PUBLIC_LIABILITY" },
  ],
  Electrician: [
    { label: "NICEIC", enumValue: "NICEIC" },
    { label: "NAPIT", enumValue: "NAPIT" },
    { label: "Part P (Electrical Safety)", enumValue: "OTHER" },
    { label: "City & Guilds 18th Edition", enumValue: "OTHER" },
    { label: "Public Liability Insurance", enumValue: "PUBLIC_LIABILITY" },
  ],
  Builder: [
    { label: "CSCS Card", enumValue: "CSCS" },
    { label: "CHAS", enumValue: "CHAS" },
    { label: "FMB Membership (Federation of Master Builders)", enumValue: "OTHER" },
    { label: "Public Liability Insurance", enumValue: "PUBLIC_LIABILITY" },
    { label: "Employers Liability Insurance", enumValue: "EMPLOYERS_LIABILITY" },
  ],
  Roofer: [
    { label: "CSCS Card", enumValue: "CSCS" },
    { label: "NFRC (National Federation of Roofing Contractors)", enumValue: "OTHER" },
    { label: "Working at Height training", enumValue: "OTHER" },
    { label: "Public Liability Insurance", enumValue: "PUBLIC_LIABILITY" },
  ],
  Decorator: [
    { label: "CSCS Card", enumValue: "CSCS" },
    { label: "Painting & Decorating Association membership", enumValue: "OTHER" },
    { label: "City & Guilds Painting & Decorating", enumValue: "OTHER" },
    { label: "Public Liability Insurance", enumValue: "PUBLIC_LIABILITY" },
  ],
  Mechanic: [
    { label: "MOT Tester Authorisation", enumValue: "OTHER", description: "DVSA accreditation" },
    { label: "IMI Membership (Institute of the Motor Industry)", enumValue: "OTHER" },
    { label: "City & Guilds Motor Vehicle qualification", enumValue: "OTHER" },
    { label: "Public Liability Insurance", enumValue: "PUBLIC_LIABILITY" },
  ],
};

export const GENERIC_CERT_SUGGESTIONS: CertSuggestion[] = [
  { label: "Public Liability Insurance", enumValue: "PUBLIC_LIABILITY" },
  { label: "Employers Liability Insurance", enumValue: "EMPLOYERS_LIABILITY" },
  { label: "Checkatrade verification", enumValue: "CHECKATRADE" },
  { label: "Other qualification or insurance", enumValue: "OTHER" },
];

// Map TRADE_CATEGORIES keys (the canonical category names stored in
// User.categoryMain) to the cert-lib keys above. Lookup falls back to
// direct match for legacy callers passing a trade name like "Plumber".
const CATEGORY_TO_CERT_KEY: Record<string, string> = {
  "Plumbing & Heating": "Plumber",
  "Electrical": "Electrician",
  "Building & Construction": "Builder",
  "Roofing & Exterior": "Roofer",
  "Decorating & Finishing": "Decorator",
  "Mechanic": "Mechanic",
};

/**
 * Look up cert suggestions for a tradesperson. Pass `categoryMain` from
 * the User row — falls back to the input as a direct key for legacy
 * callers passing a `trade` field. Unknown inputs return the generic
 * list rather than nothing.
 */
export function getCertSuggestionsForTrade(input: string | null | undefined): CertSuggestion[] {
  if (!input) return GENERIC_CERT_SUGGESTIONS;
  const key = CATEGORY_TO_CERT_KEY[input] ?? input;
  return TRADE_CERT_SUGGESTIONS[key] ?? GENERIC_CERT_SUGGESTIONS;
}
