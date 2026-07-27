import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isLocalTestMode } from "@/lib/local-test";
import { mockGetTotalBudget, mockListBudgetItems } from "./mock-store";
import type { BudgetCategorySummary, BudgetItem, BudgetSummary } from "./types";

interface BudgetItemRow {
  id: string;
  name: string;
  category: string;
  budgeted_amount: number;
  actual_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function mapRow(row: BudgetItemRow): BudgetItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    budgetedAmount: Number(row.budgeted_amount),
    actualAmount: Number(row.actual_amount),
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getTotalBudget(): Promise<number | null> {
  if (isLocalTestMode()) return mockGetTotalBudget();

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("site_settings")
    .select("total_budget")
    .eq("id", 1)
    .single();

  if (error) throw new Error(`Failed to load total budget: ${error.message}`);
  return data.total_budget === null ? null : Number(data.total_budget);
}

export async function listBudgetItems(): Promise<BudgetItem[]> {
  if (isLocalTestMode()) return mockListBudgetItems();

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("budget_items")
    .select("*")
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw new Error(`Failed to load budget items: ${error.message}`);
  return (data as BudgetItemRow[]).map(mapRow);
}

export async function getBudgetSummary(): Promise<BudgetSummary> {
  const [totalBudget, items] = await Promise.all([getTotalBudget(), listBudgetItems()]);

  const byCategory = new Map<string, BudgetCategorySummary>();
  let totalBudgeted = 0;
  let totalActual = 0;

  for (const item of items) {
    totalBudgeted += item.budgetedAmount;
    totalActual += item.actualAmount;

    const existing = byCategory.get(item.category) ?? {
      category: item.category,
      budgeted: 0,
      actual: 0,
    };
    existing.budgeted += item.budgetedAmount;
    existing.actual += item.actualAmount;
    byCategory.set(item.category, existing);
  }

  return {
    totalBudget,
    totalBudgeted,
    totalActual,
    categories: [...byCategory.values()].sort((a, b) => a.category.localeCompare(b.category)),
  };
}
