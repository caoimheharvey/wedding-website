import * as z from "zod";

export const destinationFormSchema = z.object({
  name: z.string().trim().min(1, { error: "Destination name is required" }),
  location: z.string().trim().optional(),
  description: z.string().trim().optional(),
  // Plain string, not z.coerce.number(): an empty field would coerce to 0
  // (Number("") === 0) instead of staying "no estimate yet" (null).
  estimatedCost: z.string().trim().optional(),
  costRationale: z.string().trim().optional(),
  travelNotes: z.string().trim().optional(),
  guestCapacityNotes: z.string().trim().optional(),
  pros: z.string().trim().optional(),
  cons: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

/** Empty/blank -> null (no value entered), rather than coercing to 0. */
export function parseOptionalAmount(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}
