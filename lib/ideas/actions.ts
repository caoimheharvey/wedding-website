"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import { requireAdmin } from "@/lib/dal";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isLocalTestMode } from "@/lib/local-test";
import { mockDeleteWeddingIdea, mockInsertWeddingIdea, mockListWeddingIdeas } from "./mock-store";

const ideaSchema = z.object({
  title: z.string().trim().min(1, "Enter an idea."),
  description: z.string().trim().optional(),
});

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
