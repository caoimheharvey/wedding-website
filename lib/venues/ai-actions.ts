"use server";

import * as z from "zod";
import { requireAdmin } from "@/lib/dal";
import { extractVenueReplyJson } from "@/lib/ai/venue-reply";
import { CATERING_TYPES, COORDINATION_TYPES } from "./types";
import { fieldsToForm, emptyVenueFields, type VenueDetailsForm } from "./schema";

const nullableText = z.string().nullish();
const nullableNumber = z.number().nullish();
const nullableBool = z.boolean().nullish();

const extractionSchema = z.object({
  availableDates: nullableText,
  exclusiveHire: nullableBool,
  maxCapacity: nullableNumber,
  hireHours: nullableText,
  rentalFeeSaturday: nullableNumber,
  feeIncludesVat: nullableBool,
  vatPercent: nullableNumber,
  pricePerPerson: nullableNumber,
  minSpend: nullableNumber,
  minGuests: nullableNumber,
  otherCosts: nullableText,
  estimateNotes: nullableText,
  barHoursIncluded: nullableNumber,
  extraBarHourCost: nullableNumber,
  musicCurfew: nullableText,
  ceremonyOnSite: nullableBool,
  setupTeardownIncluded: nullableBool,
  cateringType: z.enum(CATERING_TYPES).nullish(),
  coordination: z.enum(COORDINATION_TYPES).nullish(),
  coordinationCost: nullableNumber,
  onsiteAccommodation: nullableBool,
  accommodationNotes: nullableText,
  depositAmount: nullableNumber,
  paymentSchedule: nullableText,
  cancellationPolicy: nullableText,
});

export type ExtractVenueReplyResult = {
  /** Only the fields the reply actually answered, as the editor's string values. */
  values?: Partial<Record<keyof VenueDetailsForm, string>>;
  message?: string;
};

export async function aiExtractVenueReply(replyText: string): Promise<ExtractVenueReplyResult> {
  await requireAdmin();

  if (!replyText.trim()) return { message: "Paste the venue's reply first." };

  try {
    const raw = await extractVenueReplyJson(replyText);
    const json = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
    const parsed = extractionSchema.safeParse(JSON.parse(json));
    if (!parsed.success) return { message: "Couldn't read the AI's answer — fill the fields by hand." };

    // Reuse the form conversion so booleans/numbers become the editor's
    // strings, but only keep keys the reply actually answered (non-null).
    const answered = parsed.data;
    const asFields = {
      ...emptyVenueFields(),
      ...Object.fromEntries(Object.entries(answered).filter(([, value]) => value != null)),
    };
    const all = fieldsToForm(asFields);
    const values: Record<string, string> = {};
    for (const key of Object.keys(answered) as (keyof typeof answered)[]) {
      if (answered[key] != null) values[key] = all[key];
    }
    return { values };
  } catch (error) {
    return { message: error instanceof Error ? error.message : "Couldn't read the reply." };
  }
}
