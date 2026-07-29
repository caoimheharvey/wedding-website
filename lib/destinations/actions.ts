"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/dal";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isLocalTestMode } from "@/lib/local-test";
import { generateDestinationDetails, type GeneratedDestination } from "@/lib/ai/destinations";
import {
  mockDeleteDestination,
  mockDeleteDestinationRequirement,
  mockInsertDestination,
  mockInsertDestinationRequirement,
  mockSetDestinationSelected,
  mockUpdateDestination,
} from "./mock-store";
import { listDestinationRequirements, listDestinations } from "./queries";
import { destinationFormSchema, parseOptionalAmount } from "./schema";

export type DestinationActionState =
  | { errors: Record<string, string[] | undefined>; message?: string }
  | { errors?: undefined; message?: string }
  | undefined;

function destinationRowFromForm(data: z.infer<typeof destinationFormSchema>) {
  return {
    name: data.name,
    location: data.location || null,
    description: data.description || null,
    estimated_cost: parseOptionalAmount(data.estimatedCost),
    cost_rationale: data.costRationale || null,
    travel_notes: data.travelNotes || null,
    guest_capacity_notes: data.guestCapacityNotes || null,
    pros: data.pros || null,
    cons: data.cons || null,
    notes: data.notes || null,
  };
}

export async function createDestination(
  _prevState: DestinationActionState,
  formData: FormData,
): Promise<DestinationActionState> {
  await requireAdmin();

  const parsed = destinationFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };

  if (isLocalTestMode()) {
    mockInsertDestination(parsed.data);
  } else {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("destinations").insert(destinationRowFromForm(parsed.data));
    if (error) return { message: `Could not save destination: ${error.message}` };
  }

  revalidatePath("/admin/destination");
  redirect("/admin/destination");
}

export async function updateDestination(
  destinationId: string,
  _prevState: DestinationActionState,
  formData: FormData,
): Promise<DestinationActionState> {
  await requireAdmin();

  const parsed = destinationFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };

  if (isLocalTestMode()) {
    mockUpdateDestination(destinationId, parsed.data);
  } else {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("destinations")
      .update(destinationRowFromForm(parsed.data))
      .eq("id", destinationId);
    if (error) return { message: `Could not save destination: ${error.message}` };
  }

  revalidatePath("/admin/destination");
  redirect("/admin/destination");
}

export async function deleteDestination(destinationId: string): Promise<{ message?: string }> {
  await requireAdmin();

  if (isLocalTestMode()) {
    mockDeleteDestination(destinationId);
  } else {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("destinations").delete().eq("id", destinationId);
    if (error) return { message: `Could not delete destination: ${error.message}` };
  }

  revalidatePath("/admin/destination");
  return {};
}

/** Selecting a destination clears the flag on every other destination. */
export async function setDestinationSelected(
  destinationId: string,
  selected: boolean,
): Promise<{ message?: string }> {
  await requireAdmin();

  if (isLocalTestMode()) {
    mockSetDestinationSelected(destinationId, selected);
  } else {
    const supabase = getSupabaseAdmin();
    if (selected) {
      const { error: clearError } = await supabase
        .from("destinations")
        .update({ is_selected: false })
        .neq("id", destinationId);
      if (clearError) return { message: `Could not update selection: ${clearError.message}` };
    }
    const { error } = await supabase
      .from("destinations")
      .update({ is_selected: selected })
      .eq("id", destinationId);
    if (error) return { message: `Could not update selection: ${error.message}` };
  }

  revalidatePath("/admin/destination");
  return {};
}

export type RequirementActionState = { message?: string } | undefined;

export async function createDestinationRequirement(
  _prevState: RequirementActionState,
  formData: FormData,
): Promise<RequirementActionState> {
  await requireAdmin();

  const requirement = String(formData.get("requirement") ?? "").trim();
  if (!requirement) return { message: "Enter a requirement." };

  if (isLocalTestMode()) {
    mockInsertDestinationRequirement(requirement);
  } else {
    const supabase = getSupabaseAdmin();
    const { data: maxRow } = await supabase
      .from("destination_requirements")
      .select("order_index")
      .order("order_index", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { error } = await supabase.from("destination_requirements").insert({
      requirement,
      order_index: (maxRow?.order_index ?? 0) + 1,
    });
    if (error) return { message: `Could not save requirement: ${error.message}` };
  }

  revalidatePath("/admin/destination");
  return { message: "Requirement added." };
}

export async function deleteDestinationRequirement(
  requirementId: string,
): Promise<{ message?: string }> {
  await requireAdmin();

  if (isLocalTestMode()) {
    mockDeleteDestinationRequirement(requirementId);
  } else {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("destination_requirements")
      .delete()
      .eq("id", requirementId);
    if (error) return { message: `Could not remove requirement: ${error.message}` };
  }

  revalidatePath("/admin/destination");
  return {};
}

function formValuesFromGenerated(generated: GeneratedDestination, nameOverride?: string) {
  return {
    name: nameOverride ?? generated.name,
    location: generated.location ?? undefined,
    description: generated.description ?? undefined,
    estimatedCost: generated.estimatedCost != null ? String(generated.estimatedCost) : undefined,
    costRationale: generated.costRationale ?? undefined,
    travelNotes: generated.travelNotes ?? undefined,
    guestCapacityNotes: generated.guestCapacityNotes ?? undefined,
    pros: generated.pros ?? undefined,
    cons: generated.cons ?? undefined,
    notes: undefined,
  };
}

function normalizeDestinationName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Loose match so re-running research doesn't create duplicate tiles just
 * because the AI phrased the name slightly differently this time (e.g.
 * "Bodrum" vs "Bodrum, Turkey" vs "Bodrum / Antalya region").
 */
function namesLooselyMatch(a: string, b: string): boolean {
  const na = normalizeDestinationName(a);
  const nb = normalizeDestinationName(b);
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}

export type GenerateDestinationsState = { message?: string } | undefined;

/**
 * Researches candidate destinations with AI, weighed against the couple's
 * requirements checklist, and creates/updates destination rows for each
 * result plus any additional AI-suggested destinations. Still fully
 * editable afterward through the normal destination form.
 */
export async function generateDestinationsAction(
  _prevState: GenerateDestinationsState,
  formData: FormData,
): Promise<GenerateDestinationsState> {
  await requireAdmin();

  const candidates = String(formData.get("candidates") ?? "")
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (candidates.length === 0) {
    return { message: "Enter at least one destination to research." };
  }

  const requirements = (await listDestinationRequirements()).map((item) => item.requirement);

  let result;
  try {
    result = await generateDestinationDetails(candidates, requirements);
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "Could not generate destinations.",
    };
  }

  if (result.destinations.length === 0 && result.suggestions.length === 0) {
    return { message: "The AI didn't return any destinations — try again, or add one manually." };
  }

  const existingDestinations = await listDestinations();

  // Requested candidates may match either what the AI named the result or
  // what the user originally typed (the AI is asked to reuse the candidate
  // name, but isn't perfectly reliable about it).
  const requestedEntries = result.destinations.map((entry, index) => ({
    entry,
    candidateHint: candidates[index],
  }));
  const suggestionEntries = result.suggestions.map((entry) => ({
    entry,
    candidateHint: undefined as string | undefined,
  }));

  for (const { entry, candidateHint } of [...requestedEntries, ...suggestionEntries]) {
    const existingMatch = existingDestinations.find(
      (destination) =>
        namesLooselyMatch(destination.name, entry.name) ||
        (candidateHint && namesLooselyMatch(destination.name, candidateHint)),
    );

    // Keep the existing tile's name on update so re-running research can't
    // gradually rename it out from under a future match.
    const parsed = destinationFormSchema.safeParse(
      formValuesFromGenerated(entry, existingMatch?.name),
    );
    if (!parsed.success) continue;

    if (isLocalTestMode()) {
      if (existingMatch) {
        mockUpdateDestination(existingMatch.id, parsed.data);
      } else {
        mockInsertDestination(parsed.data);
      }
    } else {
      const supabase = getSupabaseAdmin();
      if (existingMatch) {
        const { error } = await supabase
          .from("destinations")
          .update(destinationRowFromForm(parsed.data))
          .eq("id", existingMatch.id);
        if (error) return { message: `Could not save ${entry.name}: ${error.message}` };
      } else {
        const { error } = await supabase
          .from("destinations")
          .insert(destinationRowFromForm(parsed.data));
        if (error) return { message: `Could not save ${entry.name}: ${error.message}` };
      }
    }
  }

  revalidatePath("/admin/destination");
  const suggestionNote =
    result.suggestions.length > 0
      ? ` and ${result.suggestions.length} additional suggestion(s)`
      : "";
  return {
    message: `Researched ${result.destinations.length} destination(s)${suggestionNote}.`,
  };
}
