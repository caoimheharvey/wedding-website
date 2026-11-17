import "server-only";
import * as z from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isLocalTestMode } from "@/lib/local-test";
import { listCategories } from "@/lib/categories/queries";
import {
  mockInsertVendor,
  mockSetVendorSelected,
  mockUpdateBookingStatus,
  mockUpdateVendor,
} from "./mock-store";
import { getVendorById } from "./queries";
import { bookingStatusFormSchema, parseOptionalAmount, vendorFormSchema } from "./schema";
import type { Vendor } from "./types";

/**
 * Vendor writes without the session check or redirects the Server Actions
 * carry, for callers that authenticate some other way (the MCP endpoint).
 * Input goes through the same zod schemas as the admin forms.
 */
export interface VendorPatch {
  category?: string;
  name?: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  priceQuote?: number | null;
  notes?: string | null;
}

const str = (value: string | number | null | undefined) => (value == null ? "" : String(value));

function formFrom(vendor: Partial<Vendor>, patch: VendorPatch) {
  const merged = { ...vendor, ...patch };
  return vendorFormSchema.safeParse({
    category: merged.category,
    name: merged.name,
    contactName: str(merged.contactName),
    email: str(merged.email),
    phone: str(merged.phone),
    website: str(merged.website),
    priceQuote: str(merged.priceQuote),
    notes: str(merged.notes),
    destinationId: str(vendor.destinationId),
  });
}

function vendorRow(data: z.infer<typeof vendorFormSchema>) {
  return {
    category: data.category,
    name: data.name,
    contact_name: data.contactName || null,
    email: data.email || null,
    phone: data.phone || null,
    website: data.website || null,
    price_quote: parseOptionalAmount(data.priceQuote),
    notes: data.notes || null,
    destination_id: data.destinationId || null,
  };
}

function describeErrors(error: z.ZodError): string {
  return Object.entries(z.flattenError(error).fieldErrors)
    .map(([field, messages]) => `${field}: ${(messages as string[]).join(", ")}`)
    .join("; ");
}

async function assertCategory(category: string) {
  const categories = await listCategories();
  if (!categories.some((entry) => entry.id === category)) {
    throw new Error(
      `Unknown category "${category}". Valid categories: ${categories.map((entry) => entry.id).join(", ")}.`,
    );
  }
}

export async function createVendorRecord(input: VendorPatch & { category: string; name: string }): Promise<Vendor> {
  await assertCategory(input.category);
  const parsed = formFrom({}, input);
  if (!parsed.success) throw new Error(describeErrors(parsed.error));

  if (isLocalTestMode()) return mockInsertVendor(parsed.data);

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("vendors").insert(vendorRow(parsed.data)).select("id").single();
  if (error) throw new Error(`Could not save vendor: ${error.message}`);
  const created = await getVendorById(data.id as string);
  if (!created) throw new Error("Vendor was saved but could not be re-read.");
  return created;
}

export async function patchVendorRecord(vendorId: string, patch: VendorPatch): Promise<Vendor> {
  const existing = await getVendorById(vendorId);
  if (!existing) throw new Error("Vendor not found.");
  if (patch.category) await assertCategory(patch.category);

  const parsed = formFrom(existing, patch);
  if (!parsed.success) throw new Error(describeErrors(parsed.error));

  if (isLocalTestMode()) {
    mockUpdateVendor(vendorId, parsed.data);
  } else {
    const { error } = await getSupabaseAdmin().from("vendors").update(vendorRow(parsed.data)).eq("id", vendorId);
    if (error) throw new Error(`Could not save vendor: ${error.message}`);
  }

  const updated = await getVendorById(vendorId);
  if (!updated) throw new Error("Vendor was saved but could not be re-read.");
  return updated;
}

export interface BookingPatch {
  depositPaid?: boolean;
  depositAmount?: number | null;
  depositDate?: string | null;
  fullyPaid?: boolean;
  fullyPaidAmount?: number | null;
  fullyPaidDate?: string | null;
}

export async function patchBookingStatus(vendorId: string, patch: BookingPatch): Promise<Vendor> {
  const existing = await getVendorById(vendorId);
  if (!existing) throw new Error("Vendor not found.");

  const merged = { ...existing, ...patch };
  const parsed = bookingStatusFormSchema.safeParse({
    depositPaid: merged.depositPaid,
    depositAmount: str(merged.depositAmount),
    depositDate: str(merged.depositDate),
    fullyPaid: merged.fullyPaid,
    fullyPaidAmount: str(merged.fullyPaidAmount),
    fullyPaidDate: str(merged.fullyPaidDate),
  });
  if (!parsed.success) throw new Error(describeErrors(parsed.error));

  if (isLocalTestMode()) {
    mockUpdateBookingStatus(vendorId, parsed.data);
  } else {
    const { error } = await getSupabaseAdmin()
      .from("vendors")
      .update({
        deposit_paid: parsed.data.depositPaid,
        deposit_amount: parseOptionalAmount(parsed.data.depositAmount),
        deposit_date: parsed.data.depositDate || null,
        fully_paid: parsed.data.fullyPaid,
        fully_paid_amount: parseOptionalAmount(parsed.data.fullyPaidAmount),
        fully_paid_date: parsed.data.fullyPaidDate || null,
      })
      .eq("id", vendorId);
    if (error) throw new Error(`Could not save booking status: ${error.message}`);
  }

  const updated = await getVendorById(vendorId);
  if (!updated) throw new Error("Vendor not found after update.");
  return updated;
}

/** Selecting a vendor clears the flag on any other vendor in the same category. */
export async function selectVendor(vendorId: string, selected: boolean): Promise<Vendor> {
  const existing = await getVendorById(vendorId);
  if (!existing) throw new Error("Vendor not found.");

  if (isLocalTestMode()) {
    mockSetVendorSelected(vendorId, selected);
  } else {
    const supabase = getSupabaseAdmin();
    if (selected) {
      const { error } = await supabase
        .from("vendors")
        .update({ is_selected: false })
        .eq("category", existing.category)
        .neq("id", vendorId);
      if (error) throw new Error(`Could not update selection: ${error.message}`);
    }
    const { error } = await supabase.from("vendors").update({ is_selected: selected }).eq("id", vendorId);
    if (error) throw new Error(`Could not update selection: ${error.message}`);
  }

  const updated = await getVendorById(vendorId);
  if (!updated) throw new Error("Vendor not found after update.");
  return updated;
}
