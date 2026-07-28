import "server-only";
import type { Category } from "./types";

/**
 * In-memory categories used only when LOCAL_TEST_BYPASS_AUTH is set. Resets
 * on every dev server restart — intentional, no persistence needed.
 */
const categories: Category[] = seed();

function seed(): Category[] {
  const starters: [string, string][] = [
    ["venue", "Venue"],
    ["catering", "Catering"],
    ["flowers_decor", "Flowers & Decor"],
    ["photography", "Photography"],
    ["videography", "Videography"],
    ["music_entertainment", "Music & Entertainment"],
    ["officiant", "Officiant"],
    ["attire", "Attire"],
    ["hair_makeup", "Hair & Makeup"],
    ["stationery", "Stationery"],
    ["cake_desserts", "Cake & Desserts"],
    ["favors", "Favors & Gifts"],
    ["transportation", "Transportation & Travel"],
    ["jewelry", "Jewelry & Rings"],
    ["other", "Miscellaneous"],
  ];
  return starters.map(([id, label], orderIndex) => ({ id, label, orderIndex }));
}

export function mockListCategories(): Category[] {
  return [...categories].sort((a, b) => a.orderIndex - b.orderIndex);
}

export function mockInsertCategory(id: string, label: string): Category {
  const orderIndex = categories.length;
  const category: Category = { id, label, orderIndex };
  categories.push(category);
  return category;
}
