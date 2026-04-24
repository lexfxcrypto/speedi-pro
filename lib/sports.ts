// ⚠️ SYNC-WITH-WEB — If you edit this file, also update
// speedi/src/lib/sports.ts in the web repo.
// Source of truth is web; this is a duplicate for offline availability in the native app.

export const SPORTS_CATEGORIES: Record<string, string[]> = {
  "Football": [
    "5-a-side Pitch",
    "7-a-side Pitch",
    "11-a-side Pitch",
    "Indoor Football",
    "Coaching Sessions",
    "Tournaments",
  ],
  "Tennis": [
    "Court Hire",
    "Coaching",
    "Junior Academy",
    "Adult Lessons",
    "Club Membership",
  ],
  "Padel": [
    "Court Hire",
    "Coaching",
    "Beginner Sessions",
    "Tournament Play",
    "Club Membership",
  ],
  "Golf": [
    "Driving Range",
    "9-hole",
    "18-hole",
    "Coaching",
    "Junior Golf",
    "Simulator",
  ],
  "Swimming": [
    "Lane Swimming",
    "Lessons",
    "Baby Swimming",
    "Aqua Fitness",
    "Private Lessons",
  ],
  "Gym & Fitness": [
    "Gym Membership",
    "Day Pass",
    "Classes",
    "Personal Training",
    "Spin",
    "CrossFit",
    "Bootcamp",
  ],
  "Boxing & Martial Arts": [
    "Boxing",
    "Kickboxing",
    "MMA",
    "BJJ",
    "Judo",
    "Karate",
    "Self Defence",
  ],
  "Multi-Sport": [
    "Sports Hall Hire",
    "Multi-Use Court",
    "Holiday Camps",
    "Birthday Parties",
    "Corporate Events",
  ],
};

export const ALL_SPORTS = Object.values(SPORTS_CATEGORIES).flat();
export const SPORTS_CATEGORY_NAMES = Object.keys(SPORTS_CATEGORIES);

/** Given a sport name, return all sports in the same category */
export function getSameCategorySports(sport: string): string[] {
  for (const sports of Object.values(SPORTS_CATEGORIES)) {
    if (sports.includes(sport)) return sports;
  }
  return [sport];
}

/** Given a sport name, return its category */
export function getSportsCategory(sport: string): string | null {
  for (const [cat, sports] of Object.entries(SPORTS_CATEGORIES)) {
    if (sports.includes(sport)) return cat;
  }
  return null;
}
