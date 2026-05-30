/**
 * Hide company-account flows (owned companies + worker clock-in + company
 * messages) for the initial TestFlight launch. Backend, schema, and APIs
 * are intact — this only gates UI entry points so the first-time UX is a
 * single mental model: self-employed pro accepting jobs.
 *
 * Flip to true to re-enable everywhere.
 */
export const SHOW_COMPANIES = false;

/**
 * Show the in-app credit purchase sheet (Apple IAP). Flip to true when:
 *   - App Store Connect IAP products have been created and approved
 *   - APPLE_IAP_SHARED_SECRET is set on the backend (Vercel)
 *   - Paid Apps Agreement is active and Small Business Program is enrolled
 *
 * When false, the rewards screen + NO_CREDITS alerts show the
 * "manage on speedi.co.uk" copy that we shipped in Path A. When true,
 * the same surfaces route to <CreditsPurchaseSheet />.
 *
 * Keep this off in any TestFlight build that pre-dates ASC product
 * approval — calling react-native-iap with non-existent SKUs throws and
 * surfaces an Apple error dialog to the tester.
 */
export const SHOW_IAP_CREDITS = true;

/**
 * Apple IAP product identifiers. MUST match the productId set in App
 * Store Connect → Monetization → In-App Purchases for the speedi-pro
 * app exactly. Same list lives server-side in /lib/iap.ts —
 * PRODUCT_CREDIT_MAP. Keep them in sync.
 *
 * Intro pricing pack sizes: 10 / 25 / 50. Middle pack shifted from 20
 * → 25 to match the web. credits_25 is a NEW product that must be
 * created in App Store Connect before the next build hits the store.
 * Apple lets you change price tier on the other two without resubmit:
 *   credits_10 → £39.99 (£4.00/credit)
 *   credits_25 → £94.99 (£3.80/credit)
 *   credits_50 → £179.99 (£3.60/credit)
 */
export const IAP_PRODUCT_IDS = [
  "com.speeditrades.speedipro.credits_10",
  "com.speeditrades.speedipro.credits_25",
  "com.speeditrades.speedipro.credits_50",
] as const;

export type IapProductId = typeof IAP_PRODUCT_IDS[number];
