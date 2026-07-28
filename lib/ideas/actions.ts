"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import { requireAdmin } from "@/lib/dal";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isLocalTestMode } from "@/lib/local-test";
import { PLANNING_PHASES } from "@/lib/planning/phases";
import { mockInsertChecklistItem } from "@/lib/planning/mock-store";
import type { PlanningPhaseId } from "@/lib/planning/types";
import {
  mockDeleteWeddingIdea,
  mockInsertWeddingIdea,
  mockListWeddingIdeas,
  mockGetWeddingIdea,
} from "./mock-store";

const ideaSchema = z.object({
  title: z.string().trim().min(1, "Enter an idea."),
  description: z.string().trim().optional(),
});

const phaseIdSchema = z.enum(
  PLANNING_PHASES.map((phase) => phase.id) as [PlanningPhaseId, ...PlanningPhaseId[]],
);

const PLANNING_PATHS = ["/admin/planning", "/admin/planning/ideas", "/admin/overview"];

function revalidatePlanning() {
  for (const path of PLANNING_PATHS) {
    revalidatePath(path);
  }
}

export type IdeaActionState = { message?: string; errors?: Record<string, string[]> } | undefined;

export async function createWeddingIdea(
  _prevState: IdeaActionState,
  formData: FormData,
): Promise<IdeaActionState> {
  await requireAdmin();

  const parsed = ideaSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  const description = parsed.data.description || null;
  const orderIndex = isLocalTestMode()
    ? mockListWeddingIdeas().length + 1
    : 0;

  if (isLocalTestMode()) {
    mockInsertWeddingIdea({
      title: parsed.data.title,
      description,
      orderIndex,
    });
  } else {
    const supabase = getSupabaseAdmin();
    const { data: maxRow } = await supabase
      .from("wedding_ideas")
      .select("order_index")
      .order("order_index", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { error } = await supabase.from("wedding_ideas").insert({
      title: parsed.data.title,
      description,
      order_index: (maxRow?.order_index ?? 0) + 1,
    });
    if (error) return { message: `Could not save idea: ${error.message}` };
  }

  revalidatePlanning();
  return { message: "Idea added." };
}

export async function deleteWeddingIdea(ideaId: string): Promise<{ message?: string }> {
  await requireAdmin();

  if (isLocalTestMode()) {
    if (!mockDeleteWeddingIdea(ideaId)) return { message: "Idea not found." };
  } else {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("wedding_ideas").delete().eq("id", ideaId);
    if (error) return { message: `Could not delete idea: ${error.message}` };
  }

  revalidatePlanning();
  return {};
}

export async function promoteWeddingIdea(
  ideaId: string,
  phaseIdInput: string,
): Promise<{ message?: string }> {
  await requireAdmin();

  const parsedPhase = phaseIdSchema.safeParse(phaseIdInput);
  if (!parsedPhase.success) return { message: "Choose a planning stage." };
  const phaseId = parsedPhase.data;

  if (isLocalTestMode()) {
    const idea = mockGetWeddingIdea(ideaId);
    if (!idea) return { message: "Idea not found." };

    mockInsertChecklistItem({ phaseId, title: idea.title, description: idea.description });
    mockDeleteWeddingIdea(ideaId);
  } else {
    const supabase = getSupabaseAdmin();
    const { data: idea, error: fetchError } = await supabase
      .from("wedding_ideas")
      .select("title, description")
      .eq("id", ideaId)
      .maybeSingle();
    if (fetchError) return { message: `Could not load idea: ${fetchError.message}` };
    if (!idea) return { message: "Idea not found." };

    const { data: maxRow } = await supabase
      .from("planning_checklist_items")
      .select("order_index")
      .eq("phase_id", phaseId)
      .order("order_index", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { error: insertError } = await supabase.from("planning_checklist_items").insert({
      phase_id: phaseId,
      title: idea.title,
      description: idea.description,
      order_index: (maxRow?.order_index ?? 0) + 1,
    });
    if (insertError) return { message: `Could not add to checklist: ${insertError.message}` };

    const { error: deleteError } = await supabase.from("wedding_ideas").delete().eq("id", ideaId);
    if (deleteError) {
      return {
        message: `Added to checklist, but couldn't remove the idea: ${deleteError.message}`,
      };
    }
  }

  revalidatePlanning();
  return { message: "Idea moved to checklist." };
}
