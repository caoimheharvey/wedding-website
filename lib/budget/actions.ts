"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isLocalTestMode } from "@/lib/local-test";
import {
  mockDeleteBudgetItem,
  mockInsertBudgetItem,
  mockUpdateBudgetItem,
  mockUpdateTotalBudget,
} from "./mock-store";
import { budgetItemFormSchema } from "./schema";

export type BudgetItemActionState =
  | { errors: Record<string, string[] | undefined>; message?: string }
  | { errors?: undefined; message?: string }
  | undefined;

function parseForm(formData: FormData) {
  return budgetItemFormSchema.safeParse(Object.fromEntries(formData));
}

function toRow(values: z.infer<typeof budgetItemFormSchema>) {
  return {
    name: values.name,
    category: values.category,
    budgeted_amount: values.budgetedAmount,
    actual_amount: values.actualAmount,
    notes: values.notes || null,
  };
}

function toFields(values: z.infer<typeof budgetItemFormSchema>) {
  return {
    name: values.name,
    category: values.category,
    budgetedAmount: values.budgetedAmount,
    actualAmount: values.actualAmount,
    notes: values.notes || null,
  };
}

export async function updateTotalBudget(amount: number | null): Promise<{ message?: string }> {
  await requireAdmin();

  if (amount !== null && (Number.isNaN(amount) || amount < 0)) {
    return { message: "Enter a valid amount." };
  }

  if (isLocalTestMode()) {
    mockUpdateTotalBudget(amount);
  } else {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("site_settings")
      .update({ total_budget: amount })
      .eq("id", 1);
    if (error) return { message: `Could not save: ${error.message}` };
  }

  revalidatePath("/admin/planning");
  return {};
}

export async function createBudgetItem(
  _prevState: BudgetItemActionState,
  formData: FormData,
): Promise<BudgetItemActionState> {
  await requireAdmin();

  const parsed = parseForm(formData);
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };

  if (isLocalTestMode()) {
    mockInsertBudgetItem(toFields(parsed.data));
  } else {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("budget_items").insert(toRow(parsed.data));
    if (error) return { message: `Could not save item: ${error.message}` };
  }

  revalidatePath("/admin/planning");
  return { message: "Item added." };
}

export async function updateBudgetItem(
  itemId: string,
  _prevState: BudgetItemActionState,
  formData: FormData,
): Promise<BudgetItemActionState> {
  await requireAdmin();

  const parsed = parseForm(formData);
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };

  if (isLocalTestMode()) {
    mockUpdateBudgetItem(itemId, toFields(parsed.data));
  } else {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("budget_items")
      .update(toRow(parsed.data))
      .eq("id", itemId);
    if (error) return { message: `Could not save item: ${error.message}` };
  }

  revalidatePath("/admin/planning");
  return { message: "Item updated." };
}

export async function deleteBudgetItem(itemId: string): Promise<{ message?: string }> {
  await requireAdmin();

  if (isLocalTestMode()) {
    mockDeleteBudgetItem(itemId);
  } else {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("budget_items").delete().eq("id", itemId);
    if (error) return { message: `Could not delete item: ${error.message}` };
  }

  revalidatePath("/admin/planning");
  return {};
}
