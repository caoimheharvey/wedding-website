"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import { requireAdmin } from "@/lib/dal";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isLocalTestMode } from "@/lib/local-test";
import {
  mockDeleteWeddingDecision,
  mockInsertWeddingDecision,
  mockListWeddingDecisions,
  mockUpdateWeddingDecision,
} from "./mock-store";

const decisionSchema = z.object({
  title: z.string().trim().min(1, "Enter a decision."),
  description: z.string().trim().optional(),
  link: z.string().trim().optional(),
  decidedDate: z.union([z.iso.date(), z.literal("")]).optional(),
});

const PLANNING_PATHS = ["/admin/planning", "/admin/planning/decisions", "/admin/overview"];

function revalidatePlanning() {
  for (const path of PLANNING_PATHS) {
    revalidatePath(path);
  }
}

export type DecisionActionState = { message?: string; errors?: Record<string, string[]> } | undefined;

export async function createWeddingDecision(
  _prevState: DecisionActionState,
  formData: FormData,
): Promise<DecisionActionState> {
  await requireAdmin();

  const parsed = decisionSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    link: formData.get("link") || undefined,
    decidedDate: formData.get("decidedDate") || undefined,
  });
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  const description = parsed.data.description || null;
  const link = parsed.data.link || null;
  const decidedDate = parsed.data.decidedDate || null;
  const orderIndex = isLocalTestMode() ? mockListWeddingDecisions().length + 1 : 0;

  if (isLocalTestMode()) {
    mockInsertWeddingDecision({
      title: parsed.data.title,
      description,
      link,
      decidedDate,
      orderIndex,
    });
  } else {
    const supabase = getSupabaseAdmin();
    const { data: maxRow } = await supabase
      .from("wedding_decisions")
      .select("order_index")
      .order("order_index", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { error } = await supabase.from("wedding_decisions").insert({
      title: parsed.data.title,
      description,
      link,
      decided_date: decidedDate,
      order_index: (maxRow?.order_index ?? 0) + 1,
    });
    if (error) return { message: `Could not save decision: ${error.message}` };
  }

  revalidatePlanning();
  return { message: "Decision added." };
}

export async function updateWeddingDecision(
  decisionId: string,
  _prevState: DecisionActionState,
  formData: FormData,
): Promise<DecisionActionState> {
  await requireAdmin();

  const parsed = decisionSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    link: formData.get("link") || undefined,
    decidedDate: formData.get("decidedDate") || undefined,
  });
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  const description = parsed.data.description || null;
  const link = parsed.data.link || null;
  const decidedDate = parsed.data.decidedDate || null;

  if (isLocalTestMode()) {
    if (!mockUpdateWeddingDecision(decisionId, { title: parsed.data.title, description, link, decidedDate })) {
      return { message: "Decision not found." };
    }
  } else {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("wedding_decisions")
      .update({
        title: parsed.data.title,
        description,
        link,
        decided_date: decidedDate,
      })
      .eq("id", decisionId);
    if (error) return { message: `Could not save decision: ${error.message}` };
  }

  revalidatePlanning();
  return { message: "Decision updated." };
}

export async function deleteWeddingDecision(decisionId: string): Promise<{ message?: string }> {
  await requireAdmin();

  if (isLocalTestMode()) {
    if (!mockDeleteWeddingDecision(decisionId)) return { message: "Decision not found." };
  } else {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("wedding_decisions").delete().eq("id", decisionId);
    if (error) return { message: `Could not delete decision: ${error.message}` };
  }

  revalidatePlanning();
  return {};
}
