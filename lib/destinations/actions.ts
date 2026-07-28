"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/dal";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isLocalTestMode } from "@/lib/local-test";
import {
  mockDeleteDestination,
  mockInsertDestination,
  mockSetDestinationSelected,
  mockUpdateDestination,
} from "./mock-store";
import { destinationFormSchema, parseOptionalAmount } from "./schema";

export type DestinationActionState =
  | { errors: Record<string, string[] | undefined>; message?: string }
  | { errors?: undefined; message?: string }
  | undefined;

function destinationRowFromForm(data: z.infer<typeof destinationFormSchema>) {
  return {
    name: data.name,
    location: data.location || null,
    description: data.description || null,
    estimated_cost: parseOptionalAmount(data.estimatedCost),
    travel_notes: data.travelNotes || null,
    guest_capacity_notes: data.guestCapacityNotes || null,
    pros: data.pros || null,
    cons: data.cons || null,
    notes: data.notes || null,
  };
}

export async function createDestination(
  _prevState: DestinationActionState,
  formData: FormData,
): Promise<DestinationActionState> {
  await requireAdmin();

  const parsed = destinationFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };

  if (isLocalTestMode()) {
    mockInsertDestination(parsed.data);
  } else {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("destinations").insert(destinationRowFromForm(parsed.data));
    if (error) return { message: `Could not save destination: ${error.message}` };
  }

  revalidatePath("/admin/destination");
  redirect("/admin/destination");
}

export async function updateDestination(
  destinationId: string,
  _prevState: DestinationActionState,
  formData: FormData,
): Promise<DestinationActionState> {
  await requireAdmin();

  const parsed = destinationFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };

  if (isLocalTestMode()) {
    mockUpdateDestination(destinationId, parsed.data);
  } else {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("destinations")
      .update(destinationRowFromForm(parsed.data))
      .eq("id", destinationId);
    if (error) return { message: `Could not save destination: ${error.message}` };
  }

  revalidatePath("/admin/destination");
  redirect("/admin/destination");
}

export async function deleteDestination(destinationId: string): Promise<{ message?: string }> {
  await requireAdmin();

  if (isLocalTestMode()) {
    mockDeleteDestination(destinationId);
  } else {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("destinations").delete().eq("id", destinationId);
    if (error) return { message: `Could not delete destination: ${error.message}` };
  }

  revalidatePath("/admin/destination");
  return {};
}

/** Selecting a destination clears the flag on every other destination. */
export async function setDestinationSelected(
  destinationId: string,
  selected: boolean,
): Promise<{ message?: string }> {
  await requireAdmin();

  if (isLocalTestMode()) {
    mockSetDestinationSelected(destinationId, selected);
  } else {
    const supabase = getSupabaseAdmin();
    if (selected) {
      const { error: clearError } = await supabase
        .from("destinations")
        .update({ is_selected: false })
        .neq("id", destinationId);
      if (clearError) return { message: `Could not update selection: ${clearError.message}` };
    }
    const { error } = await supabase
      .from("destinations")
      .update({ is_selected: selected })
      .eq("id", destinationId);
    if (error) return { message: `Could not update selection: ${error.message}` };
  }

  revalidatePath("/admin/destination");
  return {};
}
