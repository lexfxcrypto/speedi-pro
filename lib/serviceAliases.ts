/**
 * Words people actually type, mapped to the service they mean.
 *
 * ── Why this exists at all ─────────────────────────────────────────────
 * The aesthetics list is written in clinical terms — "Anti-Wrinkle
 * Injections", "Fat Dissolving Injections" — and nobody searches like
 * that. They search "botox".
 *
 * We can't simply rename the service. Botox is a brand of a
 * prescription-only medicine, and UK law (Human Medicines Regulations
 * 2012) prohibits advertising a POM to the public. Putting "Botox" in a
 * public list of things you can book is exactly that.
 *
 * Matching on the word is a different act from advertising it. So the
 * alias lives here, invisibly: you can type "botox" and find the
 * provider, and the list still only ever shows "Anti-Wrinkle
 * Injections". Mirrors COLLOQUIAL in speedi/src/lib/services.ts, which
 * does the same job for the web hero search.
 *
 * When a term is one Speedi shouldn't be seen to advertise, add it HERE
 * rather than to the service list.
 */
export const SERVICE_ALIASES: Record<string, string[]> = {
  'Anti-Wrinkle Injections': ['botox', 'anti wrinkle', 'wrinkle injections', 'baby botox'],
  'Dermal Fillers': ['filler', 'fillers', 'juvederm', 'restylane'],
  'Lip Fillers': ['lip filler', 'russian lips', 'lip enhancement'],
  'Fat Dissolving Injections': ['aqualyx', 'fat dissolving', 'lemon bottle'],
  'PRP Treatment': ['vampire facial', 'prp'],
  'Skin Boosters': ['skin booster', 'profhilo'],
  'Skin Consultation': ['aesthetician', 'skin advice'],
  'Laser Hair Removal': ['laser hair', 'hair removal'],
  'Semi-Permanent Makeup': ['spmu', 'permanent makeup'],
  'Microneedling': ['dermaroller', 'collagen induction'],
  'Chemical Peel': ['skin peel'],
  'Teeth Whitening': ['tooth whitening'],
  // Not aesthetics, but the same problem — the trade name and the word
  // people use for it are different.
  'Personal Training': ['pt', 'personal trainer', 'gym trainer'],
  'Man with a Van': ['van hire', 'house move'],
};

/** Strip case and punctuation so "Anti-Wrinkle" matches "anti wrinkle". */
function normalise(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

/**
 * Does this service match what's been typed?
 *
 * Any word may start with the query, rather than only the first — "bo"
 * has to find "Anti-Wrinkle Injections" via its "botox" alias, and
 * someone typing "wax" should find "Hot Wax", not just services
 * beginning with the word. A bare substring test alone would be too
 * loose ("art" matching "Wart Removal"), so prefix-per-word comes first
 * and a whole-phrase substring covers multi-word queries like
 * "lip filler".
 */
export function matchesServiceQuery(service: string, rawQuery: string): boolean {
  const query = normalise(rawQuery);
  if (!query) return true;

  const haystacks = [normalise(service), ...(SERVICE_ALIASES[service] ?? []).map(normalise)];

  for (const hay of haystacks) {
    if (hay.includes(query)) return true;
    if (hay.split(' ').some((word) => word.startsWith(query))) return true;
  }
  return false;
}
