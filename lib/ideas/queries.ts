import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isLocalTestMode } from "@/lib/local-test";
import { mockListWeddingIdeas } from "./mock-store";
import type { WeddingIdea } from "./types";

interface WeddingIdeaRow {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

function mapRow(row: WeddingIdeaRow): WeddingIdea {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    orderIndex: row.order_index,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listWeddingIdeas(): Promise<WeddingIdea[]> {
  if (isLocalTestMode()) return mockListWeddingIdeas();

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("wedding_ideas")
    .select("*")
    .order("order_index", { ascending: true })
    .order("title", { ascending: true });

  if (error) throw new Error(`Failed to load wedding ideas: ${error.message}`);
  return (data as WeddingIdeaRow[]).map(mapRow);
}
