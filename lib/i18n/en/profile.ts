/** English strings for this area. Keys are the contract: th/profile.ts must have every one. */
const en = {
  // Hero
  approved: '✅ Approved',
  yearsShort: '{years}+ yrs',
  radiusPill: '{miles}mi radius',

  // Company card
  companyApproved: '✓ Approved',
  companyPending: 'Pending approval',
  companyCreditsRemaining: 'Company credits remaining',
  companyResets: 'Resets {date}',
  companyMode: 'Mode: {mode}',
  modeDispatcher: 'dispatcher',
  modeAutonomous: 'autonomous',
  workersTitle: 'Workers ({count})',
  invite: '+ Invite',
  workersEmpty: 'No workers yet. Tap Invite to add your first one.',
  workerUnnamed: 'Unnamed',
  workerPendingInvite: 'Pending invite',
  workerFallback: 'Worker',
  workerInvitePending: ' · invite pending',
  inviteShareMessage: 'Join {company} on Speedi — tap to accept: {url}',

  // Business details
  businessDetails: 'Business Details',
  tradingName: 'Trading Name',
  services: 'Services',
  coverage: 'Coverage',
  locationSet: 'Location set',
  experience: 'Experience',
  experienceYears: '{years} years',

  // Portfolio
  portfolioTitle: 'Portfolio ({count}/8)',
  uploading: 'Uploading…',
  addPhoto: '+ Add photo',
  portfolioEmpty: 'No photos yet. Tap Add photo to show customers your work.',
  uploadFailedTitle: 'Upload failed',
  uploadFailedStatus: 'Upload failed ({status})',
  couldNotSavePhoto: 'Could not save photo',
  permissionNeeded: 'Permission needed',
  permissionPhotos: 'Please allow photo access to upload portfolio photos.',
  permissionCamera: 'Please allow camera access to take a photo.',
  portfolioFullTitle: 'Portfolio full',
  portfolioFullMessage: 'You can have up to 8 photos. Delete one to add another.',
  addPhotoTitle: 'Add a photo',
  addPhotoMessage: 'Choose how you want to add this photo.',
  takePhoto: 'Take photo',
  chooseFromLibrary: 'Choose from library',
  removePhotoTitle: 'Remove photo?',
  removePhotoMessage: 'This will delete it from your portfolio.',
  remove: 'Remove',

  // Certifications
  certsTitle: 'Certifications & Insurance',
  add: '+ Add',
  certsEmpty: 'No credentials added yet.',
  certVerified: '✓ Verified',
  certPending: 'Pending',

  // Socials
  socialTitle: 'Social Links',
  socialEmpty: 'Add your social links',

  // Account
  logOut: 'Log Out',
  deleteAccount: 'Delete Account',
  deleteAccountTitle: 'Delete account?',
  deleteAccountMessage:
    'This will permanently remove your Speedi account, profile, portfolio and credentials. Customers will no longer see you on the map. This cannot be undone.',
  deleteAccountConfirm: 'Delete account',
  deleteAccountSureTitle: 'Are you sure?',
  deleteAccountSureMessage: "Last chance — once deleted, your account can't be recovered.",
  couldNotDeleteAccount: 'Could not delete account',
  deleteFailedTitle: 'Delete failed',
  deleteFailedMessage: 'Try again or contact support.',

  // Coverage radius sheet
  radiusTitle: 'How far will you travel?',
  radiusNote:
    'This decides which waitlist jobs reach you. A wider radius means more jobs, further away.',
  radiusChip: '{miles}mi',
  couldNotSave: 'Could not save',
  radiusNotChanged: 'Your coverage radius was not changed. Try again.',
  checkConnection: 'Check your connection and try again.',
} as const;

export default en;
