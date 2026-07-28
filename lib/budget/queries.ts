import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isLocalTestMode } from "@/lib/local-test";
import type { WeddingCategory } from "@/lib/categories";
import { mockGetTotalBudget, mockListBudgetItems, mockListContributions } from "./mock-store";
import type { BudgetCategorySummary, BudgetContribution, BudgetItem, BudgetSummary } from "./types";

interface BudgetItemRow {
  id: string;
  name: string;
  category: WeddingCategory;
  budgeted_amount: number;
  actual_amount: number;
  is_diy: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface BudgetContributionRow {
  id: string;
  contributor_name: string;
  amount: number;
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
    isDiy: row.is_diy,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapContributionRow(row: BudgetContributionRow): BudgetContribution {
  return {
    id: row.id,
    contributorName: row.contributor_name,
    amount: Number(row.amount),
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

export async function listContributions(): Promise<BudgetContribution[]> {
  if (isLocalTestMode()) return mockListContributions();

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("budget_contributions")
    .select("*")
    .order("contributor_name", { ascending: true });

  if (error) throw new Error(`Failed to load contributions: ${error.message}`);
  return (data as BudgetContributionRow[]).map(mapContributionRow);
}

export async function getBudgetSummary(): Promise<BudgetSummary> {
  const [totalBudget, items, contributions] = await Promise.all([
    getTotalBudget(),
    listBudgetItems(),
    listContributions(),
  ]);

  const byCategory = new Map<WeddingCategory, BudgetCategorySummary>();
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

  const totalContributions = contributions.reduce((sum, c) => sum + c.amount, 0);

  return {
    totalBudget,
    totalContributions,
    availableBudget: totalBudget !== null ? totalBudget + totalContributions : null,
    totalBudgeted,
    totalActual,
    categories: [...byCategory.values()].sort((a, b) => a.category.localeCompare(b.category)),
  };
}

/** Budgeted vs. actual spend for a single category — used on the Vendors
 *  category page so the budget context is visible without leaving it. */
export async function getCategoryBudgetSummary(
  category: WeddingCategory,
): Promise<BudgetCategorySummary> {
  const items = await listBudgetItems();
  const inCategory = items.filter((item) => item.category === category);

  return {
    category,
    budgeted: inCategory.reduce((sum, item) => sum + item.budgetedAmount, 0),
    actual: inCategory.reduce((sum, item) => sum + item.actualAmount, 0),
  };
}
