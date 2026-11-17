import * as z from "zod";
import { COST_ITEM_BY_KEY, RATING_CRITERIA, SERVICE_BY_KEY } from "@/lib/venues/analysis/catalogue";
import {
  CONFIDENCE_LEVELS,
  COST_BASES,
  COST_SOURCES,
  DOG_POLICIES,
  ENGLISH_SUPPORT,
  INCLUSIONS,
  REQUIREMENTS,
  SCENARIO_LEVELS,
  SERVICE_STATUSES,
  TRI_STATES,
  VAT_TREATMENTS,
} from "@/lib/venues/analysis/types";
import { UPDATE_KINDS } from "@/lib/venues/types";

const amount = z.number().min(0).nullable();
const text = z.string().nullable();
const isoDate = z.iso.date();

/** A partial update to one cost line; only the keys sent change. */
export const costPatchSchema = z.object({
  itemKey: z.string().refine((key) => COST_ITEM_BY_KEY.has(key), { error: "Unknown cost item" }),
  amount: amount.optional(),
  amountHigh: amount.optional(),
  currency: z.string().trim().length(3).toUpperCase().optional(),
  basis: z.enum(COST_BASES).optional(),
  quantity: amount.optional(),
  requirement: z.enum(REQUIREMENTS).optional(),
  inclusion: z.enum(INCLUSIONS).optional(),
  vat: z.enum(VAT_TREATMENTS).optional(),
  source: z.enum(COST_SOURCES).nullable().optional(),
  confidence: z.enum(CONFIDENCE_LEVELS).optional(),
  sourceDate: isoDate.nullable().optional(),
  inTotal: z.boolean().optional(),
  scenarioOverride: z.enum([...SCENARIO_LEVELS, "never"]).nullable().optional(),
  notes: text.optional(),
});
export type CostPatch = z.infer<typeof costPatchSchema>;

export const servicePatchSchema = z.object({
  serviceKey: z.string().refine((key) => SERVICE_BY_KEY.has(key), { error: "Unknown service" }),
  status: z.enum(SERVICE_STATUSES).optional(),
  costItemKey: z
    .string()
    .refine((key) => COST_ITEM_BY_KEY.has(key), { error: "Unknown cost item" })
    .nullable()
    .optional(),
  confidence: z.enum(CONFIDENCE_LEVELS).optional(),
  source: z.enum(COST_SOURCES).nullable().optional(),
  sourceDate: isoDate.nullable().optional(),
  notes: text.optional(),
});
export type ServicePatch = z.infer<typeof servicePatchSchema>;

const fieldMetaSchema = z.object({
  confidence: z.enum(CONFIDENCE_LEVELS),
  source: text,
  date: isoDate.nullable(),
});

export const profilePatchSchema = z.object({
  location: text.optional(),
  address: text.optional(),
  ceremonyCapacity: z.number().int().min(0).nullable().optional(),
  receptionCapacity: z.number().int().min(0).nullable().optional(),
  partyCapacity: z.number().int().min(0).nullable().optional(),
  spaceNotes: text.optional(),
  dogPolicy: z.enum(DOG_POLICIES).optional(),
  dogAccommodation: z.enum(DOG_POLICIES).optional(),
  dogNotes: text.optional(),
  directFlightAmsterdam: z.enum(TRI_STATES).optional(),
  logisticsNotes: text.optional(),
  englishSupport: z.enum(ENGLISH_SUPPORT).optional(),
  evaluationNotes: text.optional(),
  outstandingQuestions: text.optional(),
  /** Per-field confidence; null removes a field's entry. */
  fieldMeta: z.record(z.string(), fieldMetaSchema.nullable()).optional(),
});
export type ProfilePatch = z.infer<typeof profilePatchSchema>;

export const ratingPatchSchema = z.object({
  criterionKey: z.string().refine((key) => RATING_CRITERIA.some((c) => c.key === key), { error: "Unknown criterion" }),
  /** Null clears the rating (back to "not scored"). */
  score: z.number().min(0).max(5).nullable(),
  reasoning: text.optional(),
});
export type RatingPatch = z.infer<typeof ratingPatchSchema>;

export const historyEntrySchema = z.object({
  kind: z.enum(UPDATE_KINDS).default("note"),
  date: isoDate,
  text: z.string().nullish(),
});
export type HistoryEntry = z.infer<typeof historyEntrySchema>;
