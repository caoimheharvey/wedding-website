export const OUTREACH_STATUSES = ["not_contacted", "contacted", "replied", "declined"] as const;
export type OutreachStatus = (typeof OUTREACH_STATUSES)[number];

export const OUTREACH_STATUS_LABELS: Record<OutreachStatus, string> = {
  not_contacted: "Not contacted",
  contacted: "Contacted",
  replied: "Replied",
  declined: "Declined",
};

export const CATERING_TYPES = ["in_house", "approved_list", "external_allowed"] as const;
export type CateringType = (typeof CATERING_TYPES)[number];

export const CATERING_TYPE_LABELS: Record<CateringType, string> = {
  in_house: "In-house catering",
  approved_list: "Approved caterer list",
  external_allowed: "Bring your own caterer",
};

export const COORDINATION_TYPES = ["none", "space_only", "full"] as const;
export type CoordinationType = (typeof COORDINATION_TYPES)[number];

export const COORDINATION_LABELS: Record<CoordinationType, string> = {
  none: "No coordinator",
  space_only: "Space & catering only",
  full: "Full coordination",
};

export const UPDATE_KINDS = ["reply", "visit", "call", "note"] as const;
export type UpdateKind = (typeof UPDATE_KINDS)[number];

export const UPDATE_KIND_LABELS: Record<UpdateKind, string> = {
  reply: "Reply",
  visit: "Visit",
  call: "Call",
  note: "Note",
};

/** One field that an update changed, stored as display text so history stays readable. */
export interface VenueFieldChange {
  field: string;
  label: string;
  from: string | null;
  to: string | null;
}

/** A dated entry in a venue's history: a reply, a visit, a call or a note. */
export interface VenueUpdate {
  id: string;
  vendorId: string;
  kind: UpdateKind;
  /** ISO date (YYYY-MM-DD). May be in the future for a planned visit. */
  occurredOn: string;
  rawText: string | null;
  changes: VenueFieldChange[];
  createdAt: string;
}

/**
 * A venue's answers to the standard outreach questions. `null` always means
 * "not stated / not asked yet" — never 0 or false — so comparisons can show
 * a dash instead of a misleading value.
 */
export interface VenueDetails {
  vendorId: string;
  outreachStatus: OutreachStatus;

  availableDates: string | null;
  exclusiveHire: boolean | null;
  maxCapacity: number | null;
  hireHours: string | null;

  rentalFeeSaturday: number | null;
  /** When false, `vatPercent` is added on top of the rental fee. */
  feeIncludesVat: boolean;
  vatPercent: number;
  pricePerPerson: number | null;
  minSpend: number | null;
  minGuests: number | null;
  otherCosts: string | null;
  estimateNotes: string | null;

  barHoursIncluded: number | null;
  extraBarHourCost: number | null;
  musicCurfew: string | null;
  ceremonyOnSite: boolean | null;
  setupTeardownIncluded: boolean | null;

  cateringType: CateringType | null;
  coordination: CoordinationType | null;
  coordinationCost: number | null;

  onsiteAccommodation: boolean | null;
  accommodationNotes: string | null;

  depositAmount: number | null;
  paymentSchedule: string | null;
  cancellationPolicy: string | null;

  updatedAt: string;
}

export type VenueDetailsFields = Omit<VenueDetails, "vendorId" | "updatedAt">;

export interface VenueDocument {
  id: string;
  vendorId: string;
  fileName: string;
  /** Ready-to-open URL (signed URL in Supabase mode, data URL in local test mode). */
  url: string;
  createdAt: string;
}
