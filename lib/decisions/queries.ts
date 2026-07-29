import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isLocalTestMode } from "@/lib/local-test";
import { mockListWeddingDecisions } from "./mock-store";
import type { WeddingDecision } from "./types";

interface WeddingDecisionRow {
  id: string;
  title: string;
  description: string | null;
  link: string | null;
  decided_date: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

function mapRow(row: WeddingDecisionRow): WeddingDecision {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    link: row.link,
    decidedDate: row.decided_date,
    orderIndex: row.order_index,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listWeddingDecisions(): Promise<WeddingDecision[]> {
  if (isLocalTestMode()) return mockListWeddingDecisions();

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("wedding_decisions")
    .select("*")
    .order("order_index", { ascending: true })
    .order("title", { ascending: true });

  if (error) throw new Error(`Failed to load decisions: ${error.message}`);
  return (data as WeddingDecisionRow[]).map(mapRow);
}
