import "server-only";
import type { BudgetItem } from "./types";

/**
 * In-memory budget data used only when LOCAL_TEST_BYPASS_AUTH is set.
 * Resets on every dev server restart — intentional, no persistence needed.
 */
let totalBudget: number | null = 12500;
let items: BudgetItem[] = seed();

function seed(): BudgetItem[] {
  const now = new Date().toISOString();
  const starters: Array<[string, string]> = [
    ["Venue rental", "Venue"],
    ["Catering & bar", "Catering"],
    ["Photography", "Photography & Video"],
    ["Videography", "Photography & Video"],
    ["Wedding attire", "Attire"],
    ["Hair & makeup", "Attire"],
    ["Flowers & decor", "Flowers & Decor"],
    ["Music / DJ or band", "Entertainment"],
    ["Officiant", "Ceremony"],
    ["Wedding rings", "Ceremony"],
    ["Invitations & stationery", "Stationery"],
    ["Guest travel & accommodation support", "Travel"],
    ["Favors & gifts", "Favors"],
    ["Contingency", "Miscellaneous"],
  ];

  return starters.map(([name, category]) => ({
    id: crypto.randomUUID(),
    name,
    category,
    budgetedAmount: 0,
    actualAmount: 0,
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
