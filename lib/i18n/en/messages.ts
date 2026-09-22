/** English strings for this area. Keys are the contract: th/messages.ts must have every one. */
const en = {
  // Relative times in the list
  timeJustNow: 'just now',
  timeMinutesAgo: '{count} min ago',
  timeHoursAgo: '{count} hr ago',
  timeYesterday: 'Yesterday',
  timeDaysAgo: '{count}d ago',

  // Declining
  declinedTitle: 'Declined',
  declinedBody: '{name} has been notified.',
  declineFailed: 'Could not decline. Try again.',
  declinePromptTitle: "Decline {name}'s request?",
  declinePromptBody:
    "Pick a reason — they'll get a notification so they can try another {noun}.",
  /** Used for {noun} when getProviderNoun falls back to the generic word. */
  providerFallback: 'provider',
  declineWrongJobType: 'Wrong job type',
  declineTooFar: 'Too far away',
  declineNotAvailable: 'Not available',

  // Unlocking (spends a credit)
  unlockedTitle: '✅ Connection unlocked — 1 credit spent',
  contactPhone: 'Phone: {phone}',
  contactEmail: 'Email: {email}',
  notProvided: 'Not provided',
  creditsRemainingOne: '{count} credit remaining.',
  creditsRemainingOther: '{count} credits remaining.',
  notEnoughCreditsTitle: 'Not enough credits',
  notEnoughCreditsBody: 'You need at least 1 credit to unlock this message.',
  notEnoughCreditsWebBody:
    'You need at least 1 credit to unlock this message. Credit balances are managed on speedi.co.uk — sign in from any web browser to top up.',
  buyCredits: 'Buy credits',
  unlockFailed: 'Could not unlock. Try again.',
  errorTitle: 'Error',
  connectionFailed: 'Connection failed. Try again.',

  // Opening a conversation
  newRequestFrom: 'New request from {name}',
  newMessageFrom: 'New message from {name}',
  newRequestBody:
    '"{message}"\n\nThis is a new request (more than 5 minutes after the last one). Spend 1 credit to open it.',
  newMessageBody:
    '"{message}"\n\nSpend 1 credit to unlock the customer\'s phone & email and open this request.',
  decline: 'Decline',
  openOneCredit: 'Open · 1 credit',
  replyViaSms: '💬 Reply via SMS',
  call: '📞 Call',
  email: '✉️ Email',
  replyOnWeb: '🌐 Reply on web',
  lastMessage: 'Last message:\n"{message}"',

  // The list
  quoteRequests: 'Quote Requests',
  newQuotesWaitingOne: '{count} new quote waiting',
  newQuotesWaitingOther: '{count} new quotes waiting',
  noNewQuotes: 'No new quotes',
  allMessages: 'All Messages',
  totalCount: '{count} total',
  hideOlder: 'Hide older',
  viewFullHistory: 'View full history',
  recentLabel: 'RECENT — LAST 7 DAYS',
  noRecentMessages: 'No messages in the last 7 days',
  lockBadge: '🔒 1 credit',
  newBadge: 'New',
  viewAllOlder: 'View all messages ({count} older)',
  olderLabel: 'OLDER MESSAGES',
  hideOlderMessages: 'Hide older messages',
} as const;

export default en;
