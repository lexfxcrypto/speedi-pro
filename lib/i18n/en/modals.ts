/** English strings for this area. Keys are the contract: th/modals.ts must have every one. */
const en = {
  // Shared by the modals
  failedToSave: 'Failed to save',

  // EditBusinessModal
  editBusinessTitle: 'Edit profile',
  editBusinessTradingName: 'Trading name',
  editBusinessTradingNamePlaceholder: 'e.g. Alex Plumbing & Heating',
  editBusinessServices: 'Services you offer ({count} selected)',
  editBusinessServicesNote: 'You will only get job and quote requests for the services you select here.',
  editBusinessAbout: 'About',
  editBusinessAboutPlaceholder: 'Tell customers about your experience...',
  editBusinessYears: 'Years experience',
  editBusinessYearsPlaceholder: 'e.g. 10',
  editBusinessPhone: 'Phone',
  editBusinessPhonePlaceholder: '07xxx',
  editBusinessLineId: 'LINE ID',
  editBusinessLineIdPlaceholder: 'e.g. termaza27 or @yourshop',
  editBusinessAddress: 'Coverage / business address',
  editBusinessAddressPlaceholder: 'e.g. SE15 — 10 mile radius',
  editBusinessWebsite: 'Website',
  editBusinessSave: 'Save profile',

  // AddSocialModal
  addSocialTitle: 'Add social link',
  addSocialPlatform: 'Platform',
  addSocialUrl: 'URL',
  addSocialUrlRequired: 'Enter a URL or username',

  // AddCredentialModal
  addCredentialTitle: 'Add credential',
  addCredentialType: 'Credential type',
  addCredentialTitleLabel: 'Title',
  addCredentialTitlePlaceholder: 'e.g. Gas Safe Register',
  addCredentialIssuedBy: 'Issued by',
  addCredentialIssuedByPlaceholder: 'e.g. Gas Safe Register Ltd',
  addCredentialExpiry: 'Expiry date (optional)',
  addCredentialTapToSet: 'Tap to set',
  addCredentialSave: 'Save credential',
  addCredentialPickType: 'Pick a credential type',
  addCredentialTitleRequired: 'Title is required',
  addCredentialIssuerRequired: 'Issuer is required',
  addCredentialFailed: 'Failed to add credential',

  // CreditsPurchaseSheet
  creditsTitle: 'Buy credits',
  creditsIntroBadge: 'INTRO PRICING',
  creditsSubtitle:
    '1 credit unlocks one customer contact when you respond to a job. Bigger packs save more per credit.',
  creditsUnavailable:
    "Credit packs aren't available right now. Try again in a moment, or top up on speedi.co.uk.",
  creditsLoadFailed: "Couldn't load credit packs. Check your connection and try again.",
  creditsPackCount: '{count} credits',
  creditsPerCredit: '{price} per credit',
  creditsAddedTitle: 'Credits added 🎉',
  creditsAddedOne: '{count} credit added to your account. You now have {balance}.',
  creditsAddedOther: '{count} credits added to your account. You now have {balance}.',
  creditsPurchaseFailed: 'Purchase failed',
  creditsFooter:
    "Same-priced packs are available on speedi.co.uk — saving on Apple's commission. Use whichever's easier.",

  // WaitingListPanel
  waitingEmpty:
    'When your clients follow you here, they get a notification the moment you go green — or when you post a cancellation.',
  waitingLabelOne: "customer wants to know when you're free",
  waitingLabelOther: "customers want to know when you're free",
  waitingSomeStanding:
    'All {waiting} get told when you go green. {standing} of them also asked to hear from you directly.',
  waitingMessageButton: 'Message the {count} following you',
  waitingNoStanding:
    "They'll all be told when you go green. Nobody has asked to hear from you directly yet — share your link and tell them to tick “every time”.",
  waitingSheetTitle: 'Message your list',
  waitingSheetHint:
    'Goes to the {count} who asked to hear from you every time. Your pin stays as it is — this does not make you green. Good for a slot opening up, and for saying when it has gone.',
  waitingPlaceholder: '3pm Friday just come free — first to message gets it',
  waitingSend: 'Send',
  waitingLimit: 'You can send up to 4 messages a day.',
  waitingNotYet: 'Not just yet',
  waitingCouldNotSend: 'Could not send',
  waitingSendFailed: 'Something went wrong. Try again shortly.',
  waitingSent: 'Sent',
  waitingSentNobody:
    'Nobody has asked to be told every time yet, so this went to no one. It sends automatically once people opt in.',
  waitingSentOne: 'Told {count} person.',
  waitingSentOther: 'Told {count} people.',
  waitingCheckConnection: 'Check your connection and try again.',

  // BuildYourList
  buildListHeader: 'Get your clients on your list',
  buildListHint:
    'They get a notification the moment you go green, or when you post a cancellation. Show the code at the counter, or send them the link.',
  buildListShareMessage:
    'We\'re usually booked up — but if we get a cancellation, it goes on Speedi first.\n\nTap here, download the free app and hit "Notify me" (tick "tell me every time"), and you\'ll know the moment a slot opens up:\n{link}',
  buildListSend: 'Send to clients',
  buildListCopy: 'Copy link',
  buildListCopiedTitle: 'Copied',
  buildListCopiedMessage: 'Paste it in your bio or a story.',

  // PasswordInput
  passwordShow: 'Show password',
  passwordHide: 'Hide password',

  // PhoneInputWithCountry
  phonePlaceholder: 'Phone number',
  phoneCountryCode: 'Country code',
} as const;

export default en;
