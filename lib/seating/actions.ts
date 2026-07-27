"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isLocalTestMode } from "@/lib/local-test";
import { mockAssignGuestToTable, mockUnassignAllFromTable } from "@/lib/guests/mock-store";
import {
  mockDeleteSeatingTable,
  mockInsertSeatingTable,
  mockUpdateSeatingTable,
} from "./mock-store";
import { seatingTableFormSchema } from "./schema";

export type SeatingTableActionState =
  | { errors: Record<string, string[] | undefined>; message?: string }
  | { errors?: undefined; message?: string }
  | undefined;

function parseForm(formData: FormData) {
  return seatingTableFormSchema.safeParse(Object.fromEntries(formData));
}

export async function createSeatingTable(
  _prevState: SeatingTableActionState,
  formData: FormData,
): Promise<SeatingTableActionState> {
  await requireAdmin();

  const parsed = parseForm(formData);
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };

  const data = { name: parsed.data.name, description: parsed.data.description || null };

  if (isLocalTestMode()) {
    mockInsertSeatingTable(data);
  } else {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("seating_tables").insert(data);
    if (error) return { message: `Could not save table: ${error.message}` };
  }

  revalidatePath("/admin/seating");
  return { message: "Table added." };
}

export async function updateSeatingTable(
  tableId: string,
  _prevState: SeatingTableActionState,
  formData: FormData,
): Promise<SeatingTableActionState> {
  await requireAdmin();

  const parsed = parseForm(formData);
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };

  const data = { name: parsed.data.name, description: parsed.data.description || null };

  if (isLocalTestMode()) {
    mockUpdateSeatingTable(tableId, data);
  } else {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("seating_tables").update(data).eq("id", tableId);
    if (error) return { message: `Could not save table: ${error.message}` };
  }

  revalidatePath("/admin/seating");
  return { message: "Table updated." };
}

export async function deleteSeatingTable(tableId: string): Promise<{ message?: string }> {
  await requireAdmin();

  if (isLocalTestMode()) {
    mockUnassignAllFromTable(tableId);
    mockDeleteSeatingTable(tableId);
  } else {
    const supabase = getSupabaseAdmin();
    // guests.seating_table_id is ON DELETE SET NULL, so no manual unassign needed.
    const { error } = await supabase.from("seating_tables").delete().eq("id", tableId);
    if (error) return { message: `Could not delete table: ${error.message}` };
  }

  revalidatePath("/admin/seating");
  return {};
}

export async function assignGuestToTable(
  guestId: string,
  tableId: string,
): Promise<{ message?: string }> {
  await requireAdmin();

  if (isLocalTestMode()) {
    mockAssignGuestToTable(guestId, tableId);
  } else {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("guests")
      .update({ seating_table_id: tableId })
      .eq("id", guestId);
    if (error) return { message: `Could not seat guest: ${error.message}` };
  }

  revalidatePath("/admin/seating");
  return {};
}

export async function unassignGuestFromTable(guestId: string): Promise<{ message?: string }> {
  await requireAdmin();

  if (isLocalTestMode()) {
    mockAssignGuestToTable(guestId, null);
  } else {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("guests")
      .update({ seating_table_id: null })
      .eq("id", guestId);
    if (error) return { message: `Could not remove guest: ${error.message}` };
  }

  revalidatePath("/admin/seating");
  return {};
}
