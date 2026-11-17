import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isLocalTestMode } from "@/lib/local-test";
import { listChecklistItems } from "./queries";
import { mockInsertChecklistItem, mockUpdateChecklistItem } from "./mock-store";
import type { PlanningChecklistItem, PlanningPhaseId } from "./types";

/**
 * Checklist writes without the session check or redirects the Server Actions
 * carry, for callers that authenticate some other way (the MCP endpoint).
 */
export async function addChecklistItem(data: {
  phaseId: PlanningPhaseId;
  title: string;
  description: string | null;
}): Promise<PlanningChecklistItem> {
  if (isLocalTestMode()) return mockInsertChecklistItem(data);

  const supabase = getSupabaseAdmin();
  const { data: maxRow } = await supabase
    .from("planning_checklist_items")
    .select("order_index")
    .eq("phase_id", data.phaseId)
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: row, error } = await supabase
    .from("planning_checklist_items")
    .insert({
      phase_id: data.phaseId,
      title: data.title,
      description: data.description,
      order_index: (maxRow?.order_index ?? 0) + 1,
    })
    .select("id")
    .single();
  if (error) throw new Error(`Could not add task: ${error.message}`);

  const created = (await listChecklistItems()).find((item) => item.id === row.id);
  if (!created) throw new Error("Task was added but could not be re-read.");
  return created;
}

export async function patchChecklistItem(
  itemId: string,
  patch: {
    title?: string;
    description?: string | null;
    phaseId?: PlanningPhaseId;
    isComplete?: boolean;
  },
): Promise<PlanningChecklistItem> {
  if (isLocalTestMode()) {
    const updated = mockUpdateChecklistItem(itemId, patch);
    if (!updated) throw new Error("Checklist item not found.");
    return updated;
  }

  const existing = (await listChecklistItems()).find((item) => item.id === itemId);
  if (!existing) throw new Error("Checklist item not found.");

  const supabase = getSupabaseAdmin();
  const update: Record<string, unknown> = {};
  if (patch.title !== undefined) update.title = patch.title;
  if (patch.description !== undefined) update.description = patch.description;
  if (patch.isComplete !== undefined) update.is_complete = patch.isComplete;
  if (patch.phaseId !== undefined && patch.phaseId !== existing.phaseId) {
    const { data: maxRow } = await supabase
      .from("planning_checklist_items")
      .select("order_index")
      .eq("phase_id", patch.phaseId)
      .order("order_index", { ascending: false })
      .limit(1)
      .maybeSingle();
    update.phase_id = patch.phaseId;
    update.order_index = (maxRow?.order_index ?? 0) + 1;
  }

  if (Object.keys(update).length > 0) {
    const { error } = await supabase.from("planning_checklist_items").update(update).eq("id", itemId);
    if (error) throw new Error(`Could not update task: ${error.message}`);
  }

  const updated = (await listChecklistItems()).find((item) => item.id === itemId);
  if (!updated) throw new Error("Task was updated but could not be re-read.");
  return updated;
}
