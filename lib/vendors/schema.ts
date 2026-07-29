import * as z from "zod";

export const vendorFormSchema = z.object({
  category: z.string().trim().min(1, { error: "Category is required" }),
  name: z.string().trim().min(1, { error: "Vendor name is required" }),
  contactName: z.string().trim().optional(),
  email: z.email({ error: "Enter a valid email" }).optional().or(z.literal("")),
  phone: z.string().trim().optional(),
  website: z.url({ error: "Enter a valid URL" }).optional().or(z.literal("")),
  // Plain string, not z.coerce.number(): an empty price field would coerce
  // to 0 (Number("") === 0) instead of staying "no quote yet" (null) —
  // parseOptionalAmount below handles the conversion explicitly instead.
  priceQuote: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  destinationId: z.union([z.uuid(), z.literal("")]).optional(),
});

export const bookingStatusFormSchema = z.object({
  depositPaid: z.coerce.boolean().default(false),
  depositAmount: z.string().trim().optional(),
  depositDate: z.string().trim().optional(),
  fullyPaid: z.coerce.boolean().default(false),
  fullyPaidAmount: z.string().trim().optional(),
  fullyPaidDate: z.string().trim().optional(),
});

/** Empty/blank -> null (no value entered), rather than coercing to 0. */
export function parseOptionalAmount(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}
