import "server-only";
import * as z from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isLocalTestMode } from "@/lib/local-test";
import type { CostItem, ServiceEntry, VenueProfile } from "@/lib/venues/analysis/types";
import { mockAddVenueUpdate, mockSaveVenueDetails } from "@/lib/venues/mock-store";
import { getVenueDetails } from "@/lib/venues/queries";
import { venueFieldsToRow } from "@/lib/venues/rows";
import { emptyVenueFields } from "@/lib/venues/schema";
import { legacyPatchFromCostItems } from "@/lib/venues/sync";
import type { VenueFieldChange } from "@/lib/venues/types";
import { diffCostItems, diffServices } from "./changes";
import { defaultCostItem, defaultProfile, defaultService } from "./defaults";
import {
  mockSetRating,
  mockUpsertCostItems,
  mockUpsertProfile,
  mockUpsertServices,
} from "./mock-store";
import { listVenueCostItems, listVenueProfiles, listVenueServices } from "./queries";
import { costToRow, profileToRow, serviceToRow } from "./rows";
import {
  costPatchSchema,
  profilePatchSchema,
  ratingPatchSchema,
  servicePatchSchema,
  type CostPatch,
  type HistoryEntry,
  type ProfilePatch,
  type RatingPatch,
  type ServicePatch,
} from "./schema";

/**
 * Writes for the structured venue data without the session check or
 * redirects the Server Actions carry, so the admin UI and the MCP endpoint
 * share one implementation. Callers authenticate first. Nothing here ever
 * deletes a cost line or service; clearing one just resets its fields.
 */

function describe(error: z.ZodError): string {
  return z.prettifyError(error);
}

async function logHistory(vendorId: string, entry: HistoryEntry, changes: VenueFieldChange[]) {
  const rawText = entry.text?.trim() || null;
  if (changes.length === 0 && !rawText) return;
  if (isLocalTestMode()) {
    mockAddVenueUpdate({ vendorId, kind: entry.kind, occurredOn: entry.date, rawText, changes });
    return;
  }
  const { error } = await getSupabaseAdmin().from("venue_updates").insert({
    vendor_id: vendorId,
    kind: entry.kind,
    occurred_on: entry.date,
    raw_text: rawText,
    changes,
  });
  if (error) throw new Error(`Saved, but not the history entry: ${error.message}`);
}

/**
 * Keeps the original flat price columns equal to the canonical cost lines
 * they duplicate (hire fee + VAT, per-person price, extra bar hour,
 * coordinator). Only those columns are touched.
 */
async function syncLegacyFromCostLines(vendorId: string, items: CostItem[]): Promise<void> {
  const patch = legacyPatchFromCostItems(items);
  if (Object.keys(patch).length === 0) return;

  const existing = await getVenueDetails(vendorId);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { vendorId: _vendorId, updatedAt: _updatedAt, ...fields } = existing ?? { vendorId, updatedAt: "", ...emptyVenueFields() };
  const next = { ...fields, ...patch };

  if (isLocalTestMode()) {
    mockSaveVenueDetails(vendorId, next);
    return;
  }
  const { error } = await getSupabaseAdmin().from("venue_details").upsert(venueFieldsToRow(vendorId, next));
  if (error) throw new Error(`Saved the cost lines, but not the matching venue details: ${error.message}`);
}

export interface CostWriteOptions {
  /** Update the original flat price columns too (default). Off when the change came from them. */
  syncLegacy?: boolean;
  /** Write a history entry for this change (default). */
  log?: boolean;
}

export async function applyCostPatches(
  vendorId: string,
  patches: CostPatch[],
  entry: HistoryEntry,
  { syncLegacy = true, log = true }: CostWriteOptions = {},
): Promise<{ changed: string[] }> {
  const parsed = z.array(costPatchSchema).safeParse(patches);
  if (!parsed.success) throw new Error(describe(parsed.error));

  const before = await listVenueCostItems(vendorId);
  const byKey = new Map(before.map((item) => [item.itemKey, item]));
  const next: CostItem[] = parsed.data.map(({ itemKey, ...patch }) => {
    const base = byKey.get(itemKey) ?? defaultCostItem(vendorId, itemKey);
    const defined = Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined));
    const merged = { ...base, ...defined } as CostItem;
    if (merged.amount !== null && merged.amountHigh !== null && merged.amountHigh < merged.amount) {
      throw new Error(`${itemKey}: the top of the range must be at least the amount.`);
    }
    return merged;
  });

  const changes = diffCostItems(before, next);
  if (changes.length === 0 && !entry.text?.trim()) {
    // Nothing moved on the cost lines, but a re-save still realigns the flat columns.
    if (syncLegacy) await syncLegacyFromCostLines(vendorId, next);
    return { changed: [] };
  }

  if (isLocalTestMode()) {
    mockUpsertCostItems(next);
  } else if (next.length > 0) {
    const { error } = await getSupabaseAdmin()
      .from("venue_cost_items")
      .upsert(next.map(costToRow), { onConflict: "vendor_id,item_key" });
    if (error) throw new Error(`Could not save costs: ${error.message}`);
  }
  if (syncLegacy) await syncLegacyFromCostLines(vendorId, next);
  if (log) await logHistory(vendorId, entry, changes);
  return { changed: changes.map((change) => change.label) };
}

export async function applyServicePatches(
  vendorId: string,
  patches: ServicePatch[],
  entry: HistoryEntry,
): Promise<{ changed: string[] }> {
  const parsed = z.array(servicePatchSchema).safeParse(patches);
  if (!parsed.success) throw new Error(describe(parsed.error));

  const before = await listVenueServices(vendorId);
  const byKey = new Map(before.map((item) => [item.serviceKey, item]));
  const next: ServiceEntry[] = parsed.data.map(({ serviceKey, ...patch }) => {
    const base = byKey.get(serviceKey) ?? defaultService(vendorId, serviceKey);
    const defined = Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined));
    return { ...base, ...defined } as ServiceEntry;
  });

  const changes = diffServices(before, next);
  if (changes.length === 0 && !entry.text?.trim()) return { changed: [] };

  if (isLocalTestMode()) {
    mockUpsertServices(next);
  } else if (next.length > 0) {
    const { error } = await getSupabaseAdmin()
      .from("venue_services")
      .upsert(next.map(serviceToRow), { onConflict: "vendor_id,service_key" });
    if (error) throw new Error(`Could not save services: ${error.message}`);
  }
  await logHistory(vendorId, entry, changes);
  return { changed: changes.map((change) => change.label) };
}

export async function applyProfilePatch(vendorId: string, patch: ProfilePatch): Promise<VenueProfile> {
  const parsed = profilePatchSchema.safeParse(patch);
  if (!parsed.success) throw new Error(describe(parsed.error));

  const [existing] = await listVenueProfiles(vendorId);
  const base = existing ?? defaultProfile(vendorId);
  const { fieldMeta, ...rest } = parsed.data;
  const defined = Object.fromEntries(Object.entries(rest).filter(([, value]) => value !== undefined));
  const mergedMeta = { ...base.fieldMeta };
  for (const [key, meta] of Object.entries(fieldMeta ?? {})) {
    if (meta === null) delete mergedMeta[key];
    else mergedMeta[key] = meta;
  }
  const next = { ...base, ...defined, fieldMeta: mergedMeta } as VenueProfile;

  if (isLocalTestMode()) {
    mockUpsertProfile(next);
  } else {
    const { error } = await getSupabaseAdmin().from("venue_profile").upsert(profileToRow(next));
    if (error) throw new Error(`Could not save venue profile: ${error.message}`);
  }
  return next;
}

export async function applyRatings(vendorId: string, ratings: RatingPatch[]): Promise<void> {
  const parsed = z.array(ratingPatchSchema).safeParse(ratings);
  if (!parsed.success) throw new Error(describe(parsed.error));

  for (const rating of parsed.data) {
    if (isLocalTestMode()) {
      mockSetRating(
        rating.score === null
          ? { vendorId, criterionKey: rating.criterionKey, score: null }
          : { vendorId, criterionKey: rating.criterionKey, score: rating.score, reasoning: rating.reasoning ?? null },
      );
      continue;
    }
    const supabase = getSupabaseAdmin();
    const { error } =
      rating.score === null
        ? await supabase.from("venue_ratings").delete().eq("vendor_id", vendorId).eq("criterion_key", rating.criterionKey)
        : await supabase.from("venue_ratings").upsert({
            vendor_id: vendorId,
            criterion_key: rating.criterionKey,
            score: rating.score,
            reasoning: rating.reasoning ?? null,
            updated_at: new Date().toISOString(),
          });
    if (error) throw new Error(`Could not save rating: ${error.message}`);
  }
}
