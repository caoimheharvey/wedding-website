import * as z from "zod";
import { parseOptionalAmount } from "@/lib/vendors/schema";
import {
  CATERING_TYPES,
  COORDINATION_TYPES,
  OUTREACH_STATUSES,
  UPDATE_KINDS,
  type VenueDetailsFields,
} from "./types";

const text = z.string().trim().optional();
const triState = z.union([z.literal("yes"), z.literal("no"), z.literal("")]).optional();

/**
 * Everything arrives as a string from the form. Amounts stay strings until
 * toVenueFields so a blank field means "unknown" (null) rather than 0.
 */
export const venueDetailsFormSchema = z.object({
  outreachStatus: z.enum(OUTREACH_STATUSES),
  availableDates: text,
  exclusiveHire: triState,
  maxCapacity: text,
  hireHours: text,
  rentalFeeSaturday: text,
  feeIncludesVat: triState,
  vatPercent: text,
  pricePerPerson: text,
  minSpend: text,
  minGuests: text,
  otherCosts: text,
  estimateNotes: text,
  barHoursIncluded: text,
  extraBarHourCost: text,
  musicCurfew: text,
  ceremonyOnSite: triState,
  setupTeardownIncluded: triState,
  cateringType: z.union([z.enum(CATERING_TYPES), z.literal("")]).optional(),
  coordination: z.union([z.enum(COORDINATION_TYPES), z.literal("")]).optional(),
  coordinationCost: text,
  onsiteAccommodation: triState,
  accommodationNotes: text,
  depositAmount: text,
  paymentSchedule: text,
  cancellationPolicy: text,
});

/** The log-entry part of the form: what kind of update this is, when, and the text it came from. */
export const venueUpdateMetaSchema = z.object({
  updateKind: z.enum(UPDATE_KINDS),
  updateDate: z.iso.date({ error: "Enter the date of this update" }),
  updateText: text,
});

export type VenueDetailsForm = z.infer<typeof venueDetailsFormSchema>;

function toTriState(value: string | undefined): boolean | null {
  if (value === "yes") return true;
  if (value === "no") return false;
  return null;
}

function parseOptionalInt(value: string | undefined): number | null {
  const amount = parseOptionalAmount(value);
  return amount === null ? null : Math.round(amount);
}

export function toVenueFields(data: VenueDetailsForm): VenueDetailsFields {
  return {
    outreachStatus: data.outreachStatus,
    availableDates: data.availableDates || null,
    exclusiveHire: toTriState(data.exclusiveHire),
    maxCapacity: parseOptionalInt(data.maxCapacity),
    hireHours: data.hireHours || null,
    rentalFeeSaturday: parseOptionalAmount(data.rentalFeeSaturday),
    feeIncludesVat: data.feeIncludesVat === "yes",
    vatPercent: parseOptionalAmount(data.vatPercent) ?? 21,
    pricePerPerson: parseOptionalAmount(data.pricePerPerson),
    minSpend: parseOptionalAmount(data.minSpend),
    minGuests: parseOptionalInt(data.minGuests),
    otherCosts: data.otherCosts || null,
    estimateNotes: data.estimateNotes || null,
    barHoursIncluded: parseOptionalAmount(data.barHoursIncluded),
    extraBarHourCost: parseOptionalAmount(data.extraBarHourCost),
    musicCurfew: data.musicCurfew || null,
    ceremonyOnSite: toTriState(data.ceremonyOnSite),
    setupTeardownIncluded: toTriState(data.setupTeardownIncluded),
    cateringType: data.cateringType || null,
    coordination: data.coordination || null,
    coordinationCost: parseOptionalAmount(data.coordinationCost),
    onsiteAccommodation: toTriState(data.onsiteAccommodation),
    accommodationNotes: data.accommodationNotes || null,
    depositAmount: parseOptionalAmount(data.depositAmount),
    paymentSchedule: data.paymentSchedule || null,
    cancellationPolicy: data.cancellationPolicy || null,
  };
}

const str = (value: string | number | null | undefined) => (value == null ? "" : String(value));
const tri = (value: boolean | null) => (value === null ? "" : value ? "yes" : "no");

/** Inverse of toVenueFields: the string values the editor's inputs hold. */
export function fieldsToForm(fields: VenueDetailsFields): Record<keyof VenueDetailsForm, string> {
  return {
    outreachStatus: fields.outreachStatus,
    availableDates: str(fields.availableDates),
    exclusiveHire: tri(fields.exclusiveHire),
    maxCapacity: str(fields.maxCapacity),
    hireHours: str(fields.hireHours),
    rentalFeeSaturday: str(fields.rentalFeeSaturday),
    feeIncludesVat: fields.feeIncludesVat ? "yes" : "no",
    vatPercent: str(fields.vatPercent),
    pricePerPerson: str(fields.pricePerPerson),
    minSpend: str(fields.minSpend),
    minGuests: str(fields.minGuests),
    otherCosts: str(fields.otherCosts),
    estimateNotes: str(fields.estimateNotes),
    barHoursIncluded: str(fields.barHoursIncluded),
    extraBarHourCost: str(fields.extraBarHourCost),
    musicCurfew: str(fields.musicCurfew),
    ceremonyOnSite: tri(fields.ceremonyOnSite),
    setupTeardownIncluded: tri(fields.setupTeardownIncluded),
    cateringType: str(fields.cateringType),
    coordination: str(fields.coordination),
    coordinationCost: str(fields.coordinationCost),
    onsiteAccommodation: tri(fields.onsiteAccommodation),
    accommodationNotes: str(fields.accommodationNotes),
    depositAmount: str(fields.depositAmount),
    paymentSchedule: str(fields.paymentSchedule),
    cancellationPolicy: str(fields.cancellationPolicy),
  };
}

export function emptyVenueFields(): VenueDetailsFields {
  return toVenueFields({ outreachStatus: "not_contacted" });
}
