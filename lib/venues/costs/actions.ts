"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import {
  applyCostPatches,
  applyProfilePatch,
  applyRatings,
  applyServicePatches,
} from "./service";
import type { CostPatch, HistoryEntry, ProfilePatch, RatingPatch, ServicePatch } from "./schema";

export type StructuredSaveResult = { message?: string; error?: string };

function revalidateVenue(category: string, vendorId: string) {
  revalidatePath(`/admin/vendors/${category}`);
  revalidatePath(`/admin/vendors/${category}/${vendorId}/edit`);
}

function fail(error: unknown): StructuredSaveResult {
  return { error: error instanceof Error ? error.message : "Could not save." };
}

const summary = (changed: string[], noun: string) =>
  changed.length === 0
    ? "Nothing changed."
    : `Saved: ${changed.length} ${noun}${changed.length === 1 ? "" : "s"} updated.`;

export async function saveVenueCosts(
  vendorId: string,
  category: string,
  patches: CostPatch[],
  entry: HistoryEntry,
): Promise<StructuredSaveResult> {
  await requireAdmin();
  try {
    const { changed } = await applyCostPatches(vendorId, patches, entry);
    revalidateVenue(category, vendorId);
    return { message: summary(changed, "cost line") };
  } catch (error) {
    return fail(error);
  }
}

export async function saveVenueServices(
  vendorId: string,
  category: string,
  patches: ServicePatch[],
  entry: HistoryEntry,
): Promise<StructuredSaveResult> {
  await requireAdmin();
  try {
    const { changed } = await applyServicePatches(vendorId, patches, entry);
    revalidateVenue(category, vendorId);
    return { message: summary(changed, "service") };
  } catch (error) {
    return fail(error);
  }
}

export async function saveVenueProfile(
  vendorId: string,
  category: string,
  patch: ProfilePatch,
): Promise<StructuredSaveResult> {
  await requireAdmin();
  try {
    await applyProfilePatch(vendorId, patch);
    revalidateVenue(category, vendorId);
    return { message: "Saved." };
  } catch (error) {
    return fail(error);
  }
}

export async function saveVenueRatings(
  vendorId: string,
  category: string,
  ratings: RatingPatch[],
): Promise<StructuredSaveResult> {
  await requireAdmin();
  try {
    await applyRatings(vendorId, ratings);
    revalidateVenue(category, vendorId);
    return { message: "Ratings saved." };
  } catch (error) {
    return fail(error);
  }
}
