/** English strings for this area. Keys are the contract: th/waiting.ts must have every one. */
const en = {
  // Relative times on the request cards
  timeJustNow: 'just now',
  timeMinutesAgo: '{count}m ago',
  timeHoursAgo: '{count}h ago',
  timeDaysAgo: '{count}d ago',
  timeExpired: 'expired',
  timeMinutesLeft: '{minutes}m left',
  timeHoursLeft: '{hours}h left',
  timeHoursMinutesLeft: '{hours}h {minutes}m left',
  addedAgo: 'Added {ago}',

  // Accepting a request
  acceptedTitle: '✅ Job Accepted — 1 credit spent',
  acceptedBodyOne: 'Customer: {name}\nPhone: {phone}\n\nYou have {count} credit remaining.',
  acceptedBodyOther: 'Customer: {name}\nPhone: {phone}\n\nYou have {count} credits remaining.',
  unknownCustomer: 'Unknown',
  notProvided: 'Not provided',
  later: 'Later',
  /** Stands in for the customer's name in a greeting when it is missing. */
  greetingFallbackName: 'there',
  /** Used for {noun} when getProviderNoun falls back to the generic word. */
  providerFallback: 'provider',
  smsYourProvider: 'your {noun}',
  smsAcceptedMessage:
    "Hi {name}, it's {sender} from {business}. I've seen your Speedi request and I'm able to help. I'm free now and ready to come to you. What's the best time?",
  notEnoughCreditsTitle: 'Not enough credits',
  notEnoughCreditsBody: 'You need at least 1 credit to accept a job.',
  notEnoughCreditsWebBody:
    'You need at least 1 credit to accept a job. Credit balances are managed on speedi.co.uk — sign in from any web browser to top up.',
  buyCredits: 'Buy credits',
  errorTitle: 'Error',
  acceptFailed: 'Could not accept job. Try again.',
  connectionFailed: 'Connection failed. Try again.',

  // Completing a job
  jobCompleteTitle: '✅ Job Complete!',
  askForReview: 'Want to ask {name} for a review?',
  reviewViaWhatsApp: '🟢 Review via WhatsApp',
  reviewViaSms: '⭐ Review via SMS',
  maybeLater: 'Maybe later',
  reviewRequestMessage:
    "Hi {name}, thanks for using Speedi! I hope you were happy with the work. If you have a moment I'd really appreciate a quick review — it only takes 30 seconds: {url}",

  // Contact buttons (emoji added in the screen)
  call: 'Call',
  sms: 'SMS',
  email: 'Email',

  // Active jobs
  activeJobs: 'Active Jobs',
  noActiveJobs: 'No active jobs right now',
  noActiveJobsHint: 'Accept a request below to get started',
  customer: 'Customer',
  inProgress: '● In Progress',
  markComplete: '✓ Mark Complete',
  reportConnectionFooter: 'Report this connection · reclaim credit',
  creditRefunded: 'Credit refunded ✓',
  refundDeclined: 'Refund declined',
  refundUnderReview: 'Refund request under review',

  // Live requests
  liveRequests: 'Live Requests Near You',
  noRequestsToday: 'No new requests today',
  noRequestsHint: "You'll be notified when jobs come in",
  distanceMiles: '{miles}mi',
  distanceUnknown: 'Distance unknown',
  acceptButton: 'Accept · 1 credit',
  view: '👁 View',

  // Recently completed
  recentlyCompletedOne: '✓ Recently completed ({count} job)',
  recentlyCompletedOther: '✓ Recently completed ({count} jobs)',
  completedAt: 'Completed · {time}',
  noContactDetails: 'No contact details captured for this customer',
  viewJobHistory: 'View job history',

  // Refund ("report this connection") sheet
  refundTitle: 'Report this connection',
  refundReasonNeverReplied: 'Customer never replied',
  refundReasonProOnPro: 'Another tradesperson — not a real customer',
  refundReasonSpam: 'Spam or harassment',
  refundReasonFakeJob: 'Made-up job',
  refundReasonOther: 'Other (describe below)',
  refundNoteRequired: 'Describe what happened (required)',
  refundNoteOptional: 'Anything we should know (optional)',
  refundDescribeIssue: 'Please describe the issue.',
  refundFileFailed: "Couldn't file the refund",
  refundNetworkError: 'Network error',
  refundSubmit: 'Send refund request',
  refundFooterCopy:
    'Speedi reviews every refund. Approved cases get the credit back within a day.',
} as const;

export default en;
