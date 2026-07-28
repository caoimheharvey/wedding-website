import "server-only";
import type { WeddingCategory } from "@/lib/categories";
import type { BudgetItem } from "./types";

/**
 * In-memory budget data used only when LOCAL_TEST_BYPASS_AUTH is set.
 * Resets on every dev server restart — intentional, no persistence needed.
 */
let totalBudget: number | null = 12500;
let items: BudgetItem[] = seed();

function seed(): BudgetItem[] {
  const now = new Date().toISOString();
  const starters: Array<{
    name: string;
    category: WeddingCategory;
    budgetedAmount: number;
    actualAmount: number;
    isDiy?: boolean;
  }> = [
    { name: "Venue rental", category: "venue", budgetedAmount: 6000, actualAmount: 6000 },
    { name: "Catering & bar", category: "catering", budgetedAmount: 8000, actualAmount: 0 },
    { name: "Photography", category: "photography", budgetedAmount: 3000, actualAmount: 800 },
    { name: "Videography", category: "videography", budgetedAmount: 1500, actualAmount: 0 },
    { name: "Wedding attire", category: "attire", budgetedAmount: 1200, actualAmount: 0 },
    { name: "Hair & makeup", category: "hair_makeup", budgetedAmount: 400, actualAmount: 0 },
    // Budgeted below the selected florist's quote on purpose — a real
    // "this category is going to run over" case to exercise the indicator.
    { name: "Flowers & decor", category: "flowers_decor", budgetedAmount: 2000, actualAmount: 500 },
    { name: "Music / DJ or band", category: "music_entertainment", budgetedAmount: 1500, actualAmount: 0 },
    { name: "Officiant", category: "officiant", budgetedAmount: 300, actualAmount: 0 },
    { name: "Wedding rings", category: "jewelry", budgetedAmount: 800, actualAmount: 0 },
    {
      name: "Invitations & stationery",
      category: "stationery",
      budgetedAmount: 300,
      actualAmount: 150,
      isDiy: true,
    },
    {
      name: "Guest travel & accommodation support",
      category: "transportation",
      budgetedAmount: 500,
      actualAmount: 0,
    },
    { name: "Favors & gifts", category: "favors", budgetedAmount: 200, actualAmount: 80, isDiy: true },
    { name: "Contingency", category: "other", budgetedAmount: 700, actualAmount: 0 },
  ];

  return starters.map((starter) => ({
    id: crypto.randomUUID(),
    name: starter.name,
    category: starter.category,
    budgetedAmount: starter.budgetedAmount,
    actualAmount: starter.actualAmount,
    isDiy: starter.isDiy ?? false,
    notes: null,
    createdAt: now,
    updatedAt: now,
  }));
}

export function mockGetTotalBudget(): number | null {
  return totalBudget;
}

export function mockUpdateTotalBudget(amount: number | null): void {
  totalBudget = amount;
}

export function mockListBudgetItems(): BudgetItem[] {
  return [...items].sort(
    (a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name),
  );
}

export function mockInsertBudgetItem(
  data: Omit<BudgetItem, "id" | "createdAt" | "updatedAt">,
): BudgetItem {
  const now = new Date().toISOString();
  const item: BudgetItem = { ...data, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
  items.push(item);
  return item;
}

export function mockUpdateBudgetItem(
  id: string,
  data: Omit<BudgetItem, "id" | "createdAt" | "updatedAt">,
): BudgetItem | null {
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const updated: BudgetItem = { ...items[index], ...data, updatedAt: new Date().toISOString() };
  items[index] = updated;
  return updated;
}

export function mockDeleteBudgetItem(id: string): void {
  items = items.filter((item) => item.id !== id);
}
