import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isLocalTestMode } from "@/lib/local-test";
import { mockListCategories } from "./mock-store";
import type { Category } from "./types";

interface CategoryRow {
  id: string;
  label: string;
  order_index: number;
}

function mapRow(row: CategoryRow): Category {
  return { id: row.id, label: row.label, orderIndex: row.order_index };
}

export async function listCategories(): Promise<Category[]> {
  if (isLocalTestMode()) return mockListCategories();

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("wedding_categories")
    .select("*")
    .order("order_index", { ascending: true });

  if (error) throw new Error(`Failed to load categories: ${error.message}`);
  return (data as CategoryRow[]).map(mapRow);
}
