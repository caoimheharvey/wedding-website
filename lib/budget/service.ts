import "server-only";
import * as z from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isLocalTestMode } from "@/lib/local-test";
import { listCategories } from "@/lib/categories/queries";
import {
  mockInsertBudgetItem,
  mockInsertContribution,
  mockUpdateBudgetItem,
  mockUpdateContribution,
  mockUpdateTotalBudget,
} from "./mock-store";
import { listBudgetItems, listContributions } from "./queries";
import { budgetContributionFormSchema, budgetItemFormSchema } from "./schema";
import type { BudgetContribution, BudgetItem } from "./types";

/**
 * Budget writes without the session check or redirects the Server Actions
 * carry, for callers that authenticate some other way (the MCP endpoint).
 * Input goes through the same zod schemas as the admin forms.
 */
export interface BudgetItemPatch {
  name?: string;
  category?: string;
  budgetedAmount?: number;
  actualAmount?: number;
  isDiy?: boolean;
  notes?: string | null;
}

export interface ContributionPatch {
  contributorName?: string;
  amount?: number;
  notes?: string | null;
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

function itemFields(values: z.infer<typeof budgetItemFormSchema>) {
  return {
    name: values.name,
    category: values.category,
    budgetedAmount: values.budgetedAmount,
    actualAmount: values.actualAmount,
    isDiy: values.isDiy,
    notes: values.notes || null,
  };
}

function itemRow(values: z.infer<typeof budgetItemFormSchema>) {
  return {
    name: values.name,
    category: values.category,
    budgeted_amount: values.budgetedAmount,
    actual_amount: values.actualAmount,
    is_diy: values.isDiy,
    notes: values.notes || null,
  };
}

function parseItem(base: Partial<BudgetItem>, patch: BudgetItemPatch) {
  const merged = { budgetedAmount: 0, actualAmount: 0, isDiy: false, ...base, ...patch };
  const parsed = budgetItemFormSchema.safeParse({ ...merged, notes: merged.notes ?? "" });
  if (!parsed.success) throw new Error(describeErrors(parsed.error));
  return parsed.data;
}

export async function addBudgetItem(
  input: BudgetItemPatch & { name: string; category: string },
): Promise<BudgetItem> {
  await assertCategory(input.category);
  const values = parseItem({}, input);

  if (isLocalTestMode()) return mockInsertBudgetItem(itemFields(values));

  const { data, error } = await getSupabaseAdmin().from("budget_items").insert(itemRow(values)).select("id").single();
  if (error) throw new Error(`Could not save item: ${error.message}`);
  const created = (await listBudgetItems()).find((item) => item.id === data.id);
  if (!created) throw new Error("Item was saved but could not be re-read.");
  return created;
}

export async function patchBudgetItem(itemId: string, patch: BudgetItemPatch): Promise<BudgetItem> {
  const existing = (await listBudgetItems()).find((item) => item.id === itemId);
  if (!existing) throw new Error("Budget item not found.");
  if (patch.category) await assertCategory(patch.category);
  const values = parseItem(existing, patch);

  if (isLocalTestMode()) {
    const updated = mockUpdateBudgetItem(itemId, itemFields(values));
    if (!updated) throw new Error("Budget item not found.");
    return updated;
  }

  const { error } = await getSupabaseAdmin().from("budget_items").update(itemRow(values)).eq("id", itemId);
  if (error) throw new Error(`Could not save item: ${error.message}`);
  const updated = (await listBudgetItems()).find((item) => item.id === itemId);
  if (!updated) throw new Error("Item was saved but could not be re-read.");
  return updated;
}

export async function setTotalBudget(amount: number | null): Promise<void> {
  if (amount !== null && (!Number.isFinite(amount) || amount < 0)) throw new Error("Enter a valid amount.");

  if (isLocalTestMode()) {
    mockUpdateTotalBudget(amount);
    return;
  }
  const { error } = await getSupabaseAdmin().from("site_settings").update({ total_budget: amount }).eq("id", 1);
  if (error) throw new Error(`Could not save: ${error.message}`);
}

function parseContribution(base: Partial<BudgetContribution>, patch: ContributionPatch) {
  const merged = { ...base, ...patch };
  const parsed = budgetContributionFormSchema.safeParse({ ...merged, notes: merged.notes ?? "" });
  if (!parsed.success) throw new Error(describeErrors(parsed.error));
  return {
    contributorName: parsed.data.contributorName,
    amount: parsed.data.amount,
    notes: parsed.data.notes || null,
  };
}

const contributionRow = (fields: ReturnType<typeof parseContribution>) => ({
  contributor_name: fields.contributorName,
  amount: fields.amount,
  notes: fields.notes,
});

export async function addContribution(
  input: ContributionPatch & { contributorName: string; amount: number },
): Promise<BudgetContribution> {
  const fields = parseContribution({}, input);

  if (isLocalTestMode()) return mockInsertContribution(fields);

  const { data, error } = await getSupabaseAdmin()
    .from("budget_contributions")
    .insert(contributionRow(fields))
    .select("id")
    .single();
  if (error) throw new Error(`Could not save contribution: ${error.message}`);
  const created = (await listContributions()).find((entry) => entry.id === data.id);
  if (!created) throw new Error("Contribution was saved but could not be re-read.");
  return created;
}

export async function patchContribution(id: string, patch: ContributionPatch): Promise<BudgetContribution> {
  const existing = (await listContributions()).find((entry) => entry.id === id);
  if (!existing) throw new Error("Contribution not found.");
  const fields = parseContribution(existing, patch);

  if (isLocalTestMode()) {
    const updated = mockUpdateContribution(id, fields);
    if (!updated) throw new Error("Contribution not found.");
    return updated;
  }

  const { error } = await getSupabaseAdmin().from("budget_contributions").update(contributionRow(fields)).eq("id", id);
  if (error) throw new Error(`Could not save contribution: ${error.message}`);
  const updated = (await listContributions()).find((entry) => entry.id === id);
  if (!updated) throw new Error("Contribution was saved but could not be re-read.");
  return updated;
}
