import { formatCurrency } from "@/lib/budget/format";
import {
  CATERING_TYPE_LABELS,
  COORDINATION_LABELS,
  OUTREACH_STATUS_LABELS,
  type VenueDetailsFields,
  type VenueFieldChange,
} from "./types";

type Format = (fields: VenueDetailsFields) => string | null;

const text = (key: keyof VenueDetailsFields): Format => (f) => (f[key] as string | null) || null;
const num = (key: keyof VenueDetailsFields): Format => (f) => {
  const value = f[key] as number | null;
  return value === null ? null : String(value);
};
const money = (key: keyof VenueDetailsFields): Format => (f) => {
  const value = f[key] as number | null;
  return value === null ? null : formatCurrency(value);
};
const yesNo = (key: keyof VenueDetailsFields): Format => (f) => {
  const value = f[key] as boolean | null;
  return value === null ? null : value ? "Yes" : "No";
};

/** Every answer field with its label and how to show it, in question order. */
const FIELDS: { field: keyof VenueDetailsFields; label: string; format: Format }[] = [
  { field: "outreachStatus", label: "Status", format: (f) => OUTREACH_STATUS_LABELS[f.outreachStatus] },
  { field: "availableDates", label: "Available Saturdays", format: text("availableDates") },
  { field: "exclusiveHire", label: "Exclusive hire", format: yesNo("exclusiveHire") },
  { field: "maxCapacity", label: "Max capacity", format: num("maxCapacity") },
  { field: "hireHours", label: "Hire window", format: text("hireHours") },
  { field: "rentalFeeSaturday", label: "Saturday hire fee", format: money("rentalFeeSaturday") },
  {
    field: "feeIncludesVat",
    label: "Fee includes VAT",
    format: (f) => (f.feeIncludesVat ? "Yes" : "No"),
  },
  { field: "vatPercent", label: "VAT %", format: num("vatPercent") },
  { field: "pricePerPerson", label: "Price per person", format: money("pricePerPerson") },
  { field: "minSpend", label: "Minimum spend", format: money("minSpend") },
  { field: "minGuests", label: "Minimum guests", format: num("minGuests") },
  { field: "otherCosts", label: "Other costs", format: text("otherCosts") },
  { field: "estimateNotes", label: "Estimate notes", format: text("estimateNotes") },
  { field: "barHoursIncluded", label: "Open bar hours", format: num("barHoursIncluded") },
  { field: "extraBarHourCost", label: "Extra bar hour", format: money("extraBarHourCost") },
  { field: "musicCurfew", label: "Music / curfew", format: text("musicCurfew") },
  { field: "ceremonyOnSite", label: "Ceremony on site", format: yesNo("ceremonyOnSite") },
  {
    field: "setupTeardownIncluded",
    label: "Setup & teardown included",
    format: yesNo("setupTeardownIncluded"),
  },
  {
    field: "cateringType",
    label: "Catering",
    format: (f) => (f.cateringType ? CATERING_TYPE_LABELS[f.cateringType] : null),
  },
  {
    field: "coordination",
    label: "Coordination",
    format: (f) => (f.coordination ? COORDINATION_LABELS[f.coordination] : null),
  },
  { field: "coordinationCost", label: "Coordination cost", format: money("coordinationCost") },
  { field: "onsiteAccommodation", label: "Rooms on site", format: yesNo("onsiteAccommodation") },
  { field: "accommodationNotes", label: "Nearby accommodation", format: text("accommodationNotes") },
  { field: "depositAmount", label: "Deposit", format: money("depositAmount") },
  { field: "paymentSchedule", label: "Payment schedule", format: text("paymentSchedule") },
  { field: "cancellationPolicy", label: "Cancellation", format: text("cancellationPolicy") },
];

/** Fields whose value differs between the saved details and the new ones. */
export function diffVenueFields(
  previous: VenueDetailsFields | null,
  next: VenueDetailsFields,
): VenueFieldChange[] {
  const changes: VenueFieldChange[] = [];
  for (const { field, label, format } of FIELDS) {
    const to = format(next);
    // A venue with nothing saved yet counts as "unknown" for every field,
    // except the two defaults that always have a value.
    const from = previous ? format(previous) : null;
    if (from === to) continue;
    if (!previous && (field === "outreachStatus" || field === "feeIncludesVat" || field === "vatPercent")) {
      if (to === "Not contacted" || to === "No" || to === "21") continue;
    }
    changes.push({ field, label, from, to });
  }
  return changes;
}
