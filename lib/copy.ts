// Centralised provider-noun helper. Replaces hardcoded "tradesperson" copy,
// which is wrong for service/sports providers and unspecific for trades.

type ProviderProfileLike = {
  trade?: string | null;
  trades?: string[] | null;
  servicesOffered?: string[] | null;
} | null | undefined;

export function getProviderNoun(
  profile: ProviderProfileLike,
  opts: { titleCase?: boolean } = {}
): string {
  const raw =
    profile?.trade ||
    profile?.trades?.[0] ||
    profile?.servicesOffered?.[0] ||
    null;

  if (raw) return opts.titleCase ? raw : raw.toLowerCase();
  return opts.titleCase ? 'Provider' : 'provider';
}
