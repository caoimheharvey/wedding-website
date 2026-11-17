// Planning assumptions shared by every venue, so comparisons are like-for-like.
// Change them here (or the adult count in the dashboard) and everything recomputes.

export const ASSUMPTIONS = {
  adults: 80,
  children: 0,
  /** Photographer, band, florist, etc. who may need feeding; brief says 15–20. */
  suppliers: 18,
  /** Hours used for per-hour lines that don't state a quantity (e.g. extra bar hours). */
  defaultHours: 2,
  format:
    "Saturday in September or October 2028; outdoor symbolic ceremony, cocktail reception, seated dinner, evening party.",
  budgetTargetLow: 25000,
  budgetTargetHigh: 30000,
} as const;

/** A venue is only ranked on price once this share of the intended wedding is priced. */
export const MIN_COMPLETENESS_TO_RANK = 0.7;

/** Share of ranking weight that must be scored before a numeric rank is given. */
export const MIN_COVERAGE_TO_RANK = 0.5;
