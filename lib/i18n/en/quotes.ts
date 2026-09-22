/** English strings for this area. Keys are the contract: th/quotes.ts must have every one. */
const en = {
  // Relative times on the cards
  timeJustNow: 'just now',
  timeMinutesAgo: '{count} min ago',
  timeHoursAgo: '{count} hr ago',
  timeYesterday: 'Yesterday',
  timeDaysAgo: '{count}d ago',

  // Responding (spends a credit)
  customerFallback: 'Customer',
  call: '📞 Call',
  sms: '💬 SMS',
  email: '✉️ Email',
  sentTitle: '✅ Quote sent — 1 credit spent',
  sentBody: "Your message is now in {name}'s inbox and will show in your Messages tab.",
  contactPhone: 'Phone: {phone}',
  contactEmail: 'Email: {email}',
  notProvided: 'Not provided',
  creditsRemainingOne: '{count} credit remaining.',
  creditsRemainingOther: '{count} credits remaining.',
  notEnoughCreditsTitle: 'Not enough credits',
  notEnoughCreditsBody: 'You need at least 1 credit to respond to a quote.',
  notEnoughCreditsWebBody:
    'You need at least 1 credit to respond to a quote. Credit balances are managed on speedi.co.uk — sign in from any web browser to top up.',
  buyCredits: 'Buy credits',
  closedTitle: 'Quote closed',
  closedBody: 'This quote is no longer accepting responses.',
  alreadyRespondedTitle: 'Already responded',
  alreadyRespondedBody: 'You have already sent a quote for this request.',
  errorTitle: 'Error',
  respondFailed: 'Could not respond. Try again.',
  connectionFailed: 'Connection failed. Try again.',
  confirmTitle: 'Respond to {jobType}?',
  confirmBody:
    "1 credit will be spent. You'll unlock {name}'s contact details and start a message thread.",
  theCustomer: 'the customer',
  respondButton: 'Respond · 1 credit',

  // The screen
  title: 'Quote Requests',
  empty: 'No new quote requests',
  emptyHint: 'New quotes will appear here when customers request one in your area',
  quoteRequestFallback: 'Quote request',
  responded: '✓ Responded',
  closed: 'Closed',
} as const;

export default en;
