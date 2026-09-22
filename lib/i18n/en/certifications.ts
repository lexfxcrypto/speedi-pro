/** English strings for this area. Keys are the contract: th/certifications.ts must have every one. */
const en = {
  // Display labels for the suggestions in lib/certifications.ts. The English
  // there is data (it prefills the stored credential title), so these only
  // change what is shown; see certificationLabel. Pure proper nouns (NICEIC,
  // NAPIT, CHAS, Gas Safe Register, WaterSafe, NFRC…) have no key and show
  // as they are.
  ciphe: 'CIPHE membership',
  publicLiability: 'Public Liability Insurance',
  employersLiability: 'Employers Liability Insurance',
  partP: 'Part P (Electrical Safety)',
  cscsCard: 'CSCS Card',
  fmb: 'FMB Membership (Federation of Master Builders)',
  workingAtHeight: 'Working at Height training',
  pda: 'Painting & Decorating Association membership',
  cityGuildsDecorating: 'City & Guilds Painting & Decorating',
  motTester: 'MOT Tester Authorisation',
  imi: 'IMI Membership (Institute of the Motor Industry)',
  cityGuildsMotor: 'City & Guilds Motor Vehicle qualification',
  checkatrade: 'Checkatrade verification',
  other: 'Other qualification or insurance',
  // Descriptions
  gasSafeRequired: 'Required for all gas work',
  dvsaAccreditation: 'DVSA accreditation',
} as const;

export default en;
