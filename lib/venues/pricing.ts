import type { VenueDetailsFields } from "./types";

type PricingInputs = Pick<
  VenueDetailsFields,
  "rentalFeeSaturday" | "feeIncludesVat" | "vatPercent" | "pricePerPerson" | "minSpend"
>;

/** Saturday hire fee with VAT added when the quote was given ex-VAT. */
export function hireInclVat(details: PricingInputs): number | null {
  if (details.rentalFeeSaturday === null) return null;
  return details.feeIncludesVat
    ? details.rentalFeeSaturday
    : details.rentalFeeSaturday * (1 + details.vatPercent / 100);
}

/**
 * Rough all-in comparison figure: hire incl. VAT plus per-person price as
 * quoted (not re-taxed — venues rarely say whether it includes VAT), raised
 * to the minimum spend if there is one. Null when there's nothing to price.
 */
export function estimatedTotal(details: PricingInputs, guestCount: number): number | null {
  const hire = hireInclVat(details);
  if (hire === null && details.pricePerPerson === null) return null;
  const total = (hire ?? 0) + (details.pricePerPerson ?? 0) * guestCount;
  return details.minSpend !== null ? Math.max(total, details.minSpend) : total;
}
