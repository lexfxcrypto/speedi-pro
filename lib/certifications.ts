// ⚠️ SYNC-WITH-WEB — If you edit this file, also update
// speedi/src/lib/certifications.ts in the web repo.
// Source of truth is web; this is a duplicate for offline availability in the native app.
// (Except the display-label block at the bottom, which is native only.)

import { t, type TKey } from "./i18n";

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

// ── Display labels (native only, not in the web copy) ──────────────────
// `label` and `description` above are data: the label prefills the
// credential title that is POSTed and stored, and is compared to pick the
// selected pill. So they stay English, and the UI shows these instead.
// Anything unmapped (proper nouns like NICEIC, or a web-side addition not
// yet mirrored here) falls back to the English as it is.
const LABEL_KEYS: Record<string, TKey> = {
  "CIPHE membership": "certifications.ciphe",
  "Public Liability Insurance": "certifications.publicLiability",
  "Employers Liability Insurance": "certifications.employersLiability",
  "Part P (Electrical Safety)": "certifications.partP",
  "CSCS Card": "certifications.cscsCard",
  "FMB Membership (Federation of Master Builders)": "certifications.fmb",
  "Working at Height training": "certifications.workingAtHeight",
  "Painting & Decorating Association membership": "certifications.pda",
  "City & Guilds Painting & Decorating": "certifications.cityGuildsDecorating",
  "MOT Tester Authorisation": "certifications.motTester",
  "IMI Membership (Institute of the Motor Industry)": "certifications.imi",
  "City & Guilds Motor Vehicle qualification": "certifications.cityGuildsMotor",
  "Checkatrade verification": "certifications.checkatrade",
  "Other qualification or insurance": "certifications.other",
};

const DESCRIPTION_KEYS: Record<string, TKey> = {
  "Required for all gas work": "certifications.gasSafeRequired",
  "DVSA accreditation": "certifications.dvsaAccreditation",
};

/** The suggestion's label in the app language, for display only. */
export function certificationLabel(label: string): string {
  const key = LABEL_KEYS[label];
  return key ? t(key) : label;
}

/** The suggestion's description in the app language, for display only. */
export function certificationDescription(description: string): string {
  const key = DESCRIPTION_KEYS[description];
  return key ? t(key) : description;
}
