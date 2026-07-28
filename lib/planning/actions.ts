"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import { suggestChecklistPhase } from "@/lib/ai/planning";
import { requireAdmin } from "@/lib/dal";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isLocalTestMode } from "@/lib/local-test";
import { PLANNING_PHASES } from "./phases";
import { mockInsertChecklistItem, mockSetChecklistItemComplete } from "./mock-store";
import type { PlanningPhaseId } from "./types";

const OVERVIEW_PATHS = ["/admin/overview", "/admin/planning", "/admin/planning/ideas", "/admin"];

const phaseIdSchema = z.enum(
  PLANNING_PHASES.map((phase) => phase.id) as [PlanningPhaseId, ...PlanningPhaseId[]],
);

const checklistItemSchema = z.object({
  title: z.string().trim().min(1, "Enter a task title."),
  description: z.string().trim().optional(),
  phaseId: phaseIdSchema,
});

function revalidatePlanning() {
  for (const path of OVERVIEW_PATHS) {
    revalidatePath(path);
  }
}

export async function setChecklistItemComplete(
  itemId: string,
  isComplete: boolean,
): Promise<{ message?: string }> {
  await requireAdmin();

  if (isLocalTestMode()) {
    const updated = mockSetChecklistItemComplete(itemId, isComplete);
    if (!updated) return { message: "Checklist item not found." };
  } else {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("planning_checklist_items")
      .update({ is_complete: isComplete })
      .eq("id", itemId);
    if (error) return { message: `Could not update item: ${error.message}` };
  }

  revalidatePlanning();
  return {};
}

export type ChecklistActionState =
  | { message?: string; errors?: Record<string, string[]> }
  | undefined;

export async function suggestChecklistPhaseAction(
  title: string,
  description?: string | null,
): Promise<{ phaseId?: PlanningPhaseId; message?: string }> {
  await requireAdmin();

  const trimmedTitle = title.trim();
  if (!trimmedTitle) return { message: "Enter a task title first." };

  try {
    const phaseId = await suggestChecklistPhase(trimmedTitle, description);
    return { phaseId };
  } catch (error) {
    return {
      message:
        error instanceof Error ? error.message : "Could not suggest a planning stage.",
    };
  }
}

export async function createChecklistItem(
  _prevState: ChecklistActionState,
  formData: FormData,
): Promise<ChecklistActionState> {
  await requireAdmin();

  const parsed = checklistItemSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    phaseId: formData.get("phaseId"),
  });
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  const { title, description, phaseId } = parsed.data;
  const notes = description || null;

  if (isLocalTestMode()) {
    mockInsertChecklistItem({ phaseId, title, description: notes });
  } else {
    const supabase = getSupabaseAdmin();
    const { data: maxRow } = await supabase
      .from("planning_checklist_items")
      .select("order_index")
      .eq("phase_id", phaseId)
      .order("order_index", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { error } = await supabase.from("planning_checklist_items").insert({
      phase_id: phaseId,
      title,
      description: notes,
      order_index: (maxRow?.order_index ?? 0) + 1,
    });
    if (error) return { message: `Could not add task: ${error.message}` };
  }

  revalidatePlanning();
  return { message: "Task added." };
}
