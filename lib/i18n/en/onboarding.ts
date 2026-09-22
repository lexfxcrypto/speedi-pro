/** English strings for this area. Keys are the contract: th/onboarding.ts must have every one. */
const en = {
  // welcome.tsx
  welcomeTitle: 'Welcome to Speedi',
  welcomeSubtext: "Let's set up your profile — takes about 2 minutes",
  welcomeStart: "Let's go",

  // notifications.tsx
  notifTitle: "Don't miss a job",
  notifSubtext:
    'Speedi works because Pros respond fast. Push notifications let us reach you the second a customer needs you.',
  notifLiveJobsTitle: 'Live jobs near you',
  notifLiveJobsBody: 'Customers in your area asking for help right now — be the first to respond.',
  notifAcceptedTitle: "When you've been accepted",
  notifAcceptedBody: 'A ping the moment a customer accepts your quote so you can get straight to work.',
  notifRemindersTitle: 'Approved deadline reminders',
  notifRemindersBody: 'Heads-up before any credential is about to expire — never lose your badge.',
  notifTurnOn: 'Turn on notifications',
  notifLater: 'Maybe later',

  // wizard.tsx — step 1
  joiningAs: "I'm joining as…",
  soleTrader: 'Sole trader',
  soleTraderSubtext: 'Self-employed, just me',
  companyOwner: 'Company owner',
  companyOwnerSubtext: 'I employ workers',

  // step 2
  whatAreYou: 'What are you?',
  providerTrade: 'Trade',
  providerTradeSubtext: 'Plumber, electrician, builder…',
  providerConcierge: 'Trade Concierge',
  providerConciergeSubtext: 'Local generalist — covers many trades',
  providerService: 'Service',
  providerServiceSubtext: 'Beauty, fitness, tutoring…',
  providerSports: 'Sports',
  providerSportsSubtext: 'Venues, coaching, bookings…',
  providerMerchant: 'Merchant',
  providerMerchantSubtext: 'Fixed premises — plumbers merchant, wholesaler, yard',

  // step 3
  howDoYouWork: 'How do you work?',
  premisesMobile: 'Mobile',
  premisesMobileSubtext: 'I travel to customers',
  premisesFixed: 'Fixed',
  premisesFixedSubtext: 'Customers come to me',
  premisesBoth: 'Both',
  premisesBothSubtext: 'Mix of both',

  // step 4
  whatsYourCategory: "What's your category?",
  otherCategory: 'Other',
  describeCategory: 'Describe your category',

  // step 5 — merchant
  merchantHeading: 'Tell us about your business',
  merchantIntro:
    'Merchants appear on the customer map with your address, phone, opening hours and description all publicly visible — no need for customers to message first.',
  merchantBuildingLabel: 'Building / unit / number (optional)',
  merchantBuildingPlaceholder: 'e.g. Unit 4, Trade Park',
  merchantStreetLabel: 'Street',
  merchantStreetPlaceholder: 'e.g. Kent Street',
  merchantTownLabel: 'Town / city',
  merchantTownPlaceholder: 'e.g. Blackburn',
  merchantCountyLabel: 'County (optional)',
  merchantCountyPlaceholder: 'e.g. Lancashire',
  merchantPostcodeNote: 'Postcode is captured on the next step and used to place your pin on the map.',
  merchantPhoneLabel: 'Counter phone',
  merchantPhonePlaceholder: '01772 123456',
  merchantEmailLabel: 'Business email (optional)',
  merchantEmailPlaceholder: 'orders@yourbusiness.co.uk',
  merchantWebsiteLabel: 'Website (optional)',
  merchantWebsitePlaceholder: 'www.yourbusiness.co.uk',
  merchantHoursLabel: 'Opening hours',
  merchantHoursPlaceholder: 'Mon–Fri 7:30–17:00, Sat 8:00–12:00',
  merchantDescriptionLabel: 'Description',
  merchantDescriptionPlaceholder:
    'Family-run plumbing + heating merchants. Same-day delivery within 15 miles. Trade counter on-site.',
  merchantStockIntro:
    'What supplies do you stock? Customers filtering by trade will see you under every category you tick.',
  categoriesStockedOne: '{count} category stocked',
  categoriesStockedOther: '{count} categories stocked',

  // step 5 — everyone else
  whichTrades: 'Which trades can you cover?',
  whatDoYouOffer: 'What specifically do you offer?',
  describeOffer: 'Describe what you offer in a sentence or two',
  conciergeIntro:
    'Pick everything you can help with — customers will see you under every filter you tick, and you’ll get notified for waitlist requests across all of them.',
  selectAll: 'Select all that apply',
  tradesSelectedOne: '{count} trade selected',
  tradesSelectedOther: '{count} trades selected',
  searchServices: 'Search services',
  nothingMatches: 'Nothing matches “{query}”.',

  // step 6
  yourProfile: 'Your profile',
  yourName: 'Your name',
  yourNamePlaceholder: 'e.g. John Smith',
  businessNameLabel: 'Business or trading name (optional)',
  businessNamePlaceholder: 'e.g. Smith Plumbing Ltd',
  yearsInBusiness: 'Years in business',
  yearsUnder1: 'Under 1 year',
  years1to3: '1-3 years',
  years3to10: '3-10 years',
  years10plus: '10+ years',
  locationWhyTitle: 'Why we need location',
  locationWhyBody:
    "Your location helps customers find you when you're available. We only check your location when you're showing as available for work.",
  locationAllowed: 'Location allowed ✓',
  allowLocation: 'Allow location',
  locationDeniedNote: 'You can enable later in your iPhone Settings.',
  postcodeLabel: 'Postcode or area',
  postcodePlaceholder: 'e.g. PR1, or Pattaya',
  postcodeHint: 'A UK postcode, or the town or district you work in.',
  serviceRadius: 'Service radius: {radius} miles',
  radiusOption: '{radius}mi',
  profilePhotoLabel: 'Profile photo (optional)',
  photoPermissionTitle: 'Permission needed',
  photoPermissionBody: 'Please allow photo access to upload a profile photo.',
  uploadFailedTitle: 'Upload failed',
  uploadFailedStatus: 'Upload failed: {status}',
  pleaseTryAgain: 'Please try again',

  // step 7
  youreReady: "You're ready",
  readyBody:
    "Your profile is set up. Customers can see you on the map as soon as you're live. You can go online or offline any time from your dashboard.",
  goLiveNow: 'Go live now?',
  goLiveOnNote: "You'll appear on the map for 1 hour then automatically go offline.",
  goLiveOffNote: 'Stay offline — go live from the dashboard when ready.',
  completeSetup: 'Complete Setup',
  setupFailed: 'Failed to complete setup',
} as const;

export default en;
