"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/dal";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isLocalTestMode } from "@/lib/local-test";
import {
  mockDeleteVendor,
  mockInsertVendor,
  mockSetVendorSelected,
  mockUpdateBookingStatus,
  mockUpdateVendor,
} from "./mock-store";
import { bookingStatusFormSchema, parseOptionalAmount, vendorFormSchema } from "./schema";
// Category ids are plain strings (see lib/vendors/types.ts).
type VendorCategory = string;

export type VendorActionState =
  | { errors: Record<string, string[] | undefined>; message?: string }
  | { errors?: undefined; message?: string }
  | undefined;

function vendorRowFromForm(data: z.infer<typeof vendorFormSchema>) {
  return {
    category: data.category,
    name: data.name,
    contact_name: data.contactName || null,
    email: data.email || null,
    phone: data.phone || null,
    website: data.website || null,
    price_quote: parseOptionalAmount(data.priceQuote),
    notes: data.notes || null,
  };
}

export async function createVendor(
  category: VendorCategory,
  _prevState: VendorActionState,
  formData: FormData,
): Promise<VendorActionState> {
  await requireAdmin();

  const parsed = vendorFormSchema.safeParse({ ...Object.fromEntries(formData), category });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };

  if (isLocalTestMode()) {
    mockInsertVendor(parsed.data);
  } else {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("vendors").insert(vendorRowFromForm(parsed.data));
    if (error) return { message: `Could not save vendor: ${error.message}` };
  }

  revalidatePath(`/admin/vendors/${category}`);
  redirect(`/admin/vendors/${category}`);
}

export async function updateVendor(
  vendorId: string,
  category: VendorCategory,
  _prevState: VendorActionState,
  formData: FormData,
): Promise<VendorActionState> {
  await requireAdmin();

  const parsed = vendorFormSchema.safeParse({ ...Object.fromEntries(formData), category });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };

  if (isLocalTestMode()) {
    mockUpdateVendor(vendorId, parsed.data);
  } else {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("vendors")
      .update(vendorRowFromForm(parsed.data))
      .eq("id", vendorId);
    if (error) return { message: `Could not save vendor: ${error.message}` };
  }

  revalidatePath(`/admin/vendors/${category}`);
  redirect(`/admin/vendors/${category}`);
}

export async function deleteVendor(vendorId: string, category: VendorCategory): Promise<{ message?: string }> {
  await requireAdmin();

  if (isLocalTestMode()) {
    mockDeleteVendor(vendorId);
  } else {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("vendors").delete().eq("id", vendorId);
    if (error) return { message: `Could not delete vendor: ${error.message}` };
  }

  revalidatePath(`/admin/vendors/${category}`);
  return {};
}

/** Selecting a vendor clears the flag on any other vendor in the same category. */
export async function setVendorSelected(
  vendorId: string,
  category: VendorCategory,
  selected: boolean,
): Promise<{ message?: string }> {
  await requireAdmin();

  if (isLocalTestMode()) {
    mockSetVendorSelected(vendorId, selected);
  } else {
    const supabase = getSupabaseAdmin();
    if (selected) {
      const { error: clearError } = await supabase
        .from("vendors")
        .update({ is_selected: false })
        .eq("category", category)
        .neq("id", vendorId);
      if (clearError) return { message: `Could not update selection: ${clearError.message}` };
    }
    const { error } = await supabase
      .from("vendors")
      .update({ is_selected: selected })
      .eq("id", vendorId);
    if (error) return { message: `Could not update selection: ${error.message}` };
  }

  revalidatePath(`/admin/vendors/${category}`);
  return {};
}

export async function updateBookingStatus(
  vendorId: string,
  category: VendorCategory,
  _prevState: VendorActionState,
  formData: FormData,
): Promise<VendorActionState> {
  await requireAdmin();

  const parsed = bookingStatusFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };

  if (isLocalTestMode()) {
    mockUpdateBookingStatus(vendorId, parsed.data);
  } else {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
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
    if (error) return { message: `Could not save booking status: ${error.message}` };
  }

  revalidatePath(`/admin/vendors/${category}`);
  return { message: "Booking status updated." };
}
