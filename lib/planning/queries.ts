import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isLocalTestMode } from "@/lib/local-test";
import { getSiteSettings } from "@/lib/rsvp/queries";
import { getCurrentPlanningPhase, PLANNING_PHASES } from "./phases";
import { mockListChecklistItems } from "./mock-store";
import type {
  ChecklistPhaseSummary,
  ChecklistSummary,
  PlanningChecklistItem,
  PlanningPhaseId,
} from "./types";

interface ChecklistItemRow {
  id: string;
  phase_id: string;
  title: string;
  description: string | null;
  order_index: number;
  is_complete: boolean;
  created_at: string;
  updated_at: string;
}

function mapRow(row: ChecklistItemRow): PlanningChecklistItem {
  return {
    id: row.id,
    phaseId: row.phase_id as PlanningPhaseId,
    title: row.title,
    description: row.description,
    orderIndex: row.order_index,
    isComplete: row.is_complete,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listChecklistItems(): Promise<PlanningChecklistItem[]> {
  if (isLocalTestMode()) return mockListChecklistItems();

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("planning_checklist_items")
    .select("*")
    .order("phase_id", { ascending: true })
    .order("order_index", { ascending: true });

  if (error) throw new Error(`Failed to load checklist: ${error.message}`);
  return (data as ChecklistItemRow[]).map(mapRow);
}

export async function getChecklistSummary(): Promise<ChecklistSummary> {
  const [items, siteSettings] = await Promise.all([listChecklistItems(), getSiteSettings()]);
  const currentPhase = getCurrentPlanningPhase(siteSettings.weddingDate);

  const phases: ChecklistPhaseSummary[] = PLANNING_PHASES.map((phase) => {
    const phaseItems = items.filter((item) => item.phaseId === phase.id);
    const completedCount = phaseItems.filter((item) => item.isComplete).length;
    return {
      phase,
      items: phaseItems,
      completedCount,
      totalCount: phaseItems.length,
    };
  });

  const completedCount = items.filter((item) => item.isComplete).length;

  return {
    phases,
    completedCount,
    totalCount: items.length,
    currentPhase,
  };
}
