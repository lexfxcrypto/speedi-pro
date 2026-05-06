/**
 * Hide company-account flows (owned companies + worker clock-in + company
 * messages) for the initial TestFlight launch. Backend, schema, and APIs
 * are intact — this only gates UI entry points so the first-time UX is a
 * single mental model: self-employed pro accepting jobs.
 *
 * Flip to true to re-enable everywhere.
 */
export const SHOW_COMPANIES = false;
