import type { VenueDetails, VenueDetailsFields } from "./types";

export interface VenueDetailsRow {
  vendor_id: string;
  outreach_status: VenueDetails["outreachStatus"];
  available_dates: string | null;
  exclusive_hire: boolean | null;
  max_capacity: number | null;
  hire_hours: string | null;
  rental_fee_saturday: number | null;
  fee_includes_vat: boolean;
  vat_percent: number;
  price_per_person: number | null;
  min_spend: number | null;
  min_guests: number | null;
  other_costs: string | null;
  estimate_notes: string | null;
  bar_hours_included: number | null;
  extra_bar_hour_cost: number | null;
  music_curfew: string | null;
  ceremony_on_site: boolean | null;
  setup_teardown_included: boolean | null;
  catering_type: VenueDetails["cateringType"];
  coordination: VenueDetails["coordination"];
  coordination_cost: number | null;
  onsite_accommodation: boolean | null;
  accommodation_notes: string | null;
  deposit_amount: number | null;
  payment_schedule: string | null;
  cancellation_policy: string | null;
  updated_at: string;
}

// Postgres numeric columns come back as strings from PostgREST for some
// drivers; Number() keeps nullable amounts null and real ones numeric.
const num = (value: number | string | null) => (value === null ? null : Number(value));

export function mapVenueRow(row: VenueDetailsRow): VenueDetails {
  return {
    vendorId: row.vendor_id,
    outreachStatus: row.outreach_status,
    availableDates: row.available_dates,
    exclusiveHire: row.exclusive_hire,
    maxCapacity: row.max_capacity,
    hireHours: row.hire_hours,
    rentalFeeSaturday: num(row.rental_fee_saturday),
    feeIncludesVat: row.fee_includes_vat,
    vatPercent: Number(row.vat_percent),
    pricePerPerson: num(row.price_per_person),
    minSpend: num(row.min_spend),
    minGuests: row.min_guests,
    otherCosts: row.other_costs,
    estimateNotes: row.estimate_notes,
    barHoursIncluded: num(row.bar_hours_included),
    extraBarHourCost: num(row.extra_bar_hour_cost),
    musicCurfew: row.music_curfew,
    ceremonyOnSite: row.ceremony_on_site,
    setupTeardownIncluded: row.setup_teardown_included,
    cateringType: row.catering_type,
    coordination: row.coordination,
    coordinationCost: num(row.coordination_cost),
    onsiteAccommodation: row.onsite_accommodation,
    accommodationNotes: row.accommodation_notes,
    depositAmount: num(row.deposit_amount),
    paymentSchedule: row.payment_schedule,
    cancellationPolicy: row.cancellation_policy,
    updatedAt: row.updated_at,
  };
}

export function venueFieldsToRow(vendorId: string, fields: VenueDetailsFields) {
  return {
    vendor_id: vendorId,
    outreach_status: fields.outreachStatus,
    available_dates: fields.availableDates,
    exclusive_hire: fields.exclusiveHire,
    max_capacity: fields.maxCapacity,
    hire_hours: fields.hireHours,
    rental_fee_saturday: fields.rentalFeeSaturday,
    fee_includes_vat: fields.feeIncludesVat,
    vat_percent: fields.vatPercent,
    price_per_person: fields.pricePerPerson,
    min_spend: fields.minSpend,
    min_guests: fields.minGuests,
    other_costs: fields.otherCosts,
    estimate_notes: fields.estimateNotes,
    bar_hours_included: fields.barHoursIncluded,
    extra_bar_hour_cost: fields.extraBarHourCost,
    music_curfew: fields.musicCurfew,
    ceremony_on_site: fields.ceremonyOnSite,
    setup_teardown_included: fields.setupTeardownIncluded,
    catering_type: fields.cateringType,
    coordination: fields.coordination,
    coordination_cost: fields.coordinationCost,
    onsite_accommodation: fields.onsiteAccommodation,
    accommodation_notes: fields.accommodationNotes,
    deposit_amount: fields.depositAmount,
    payment_schedule: fields.paymentSchedule,
    cancellation_policy: fields.cancellationPolicy,
    updated_at: new Date().toISOString(),
  };
}
