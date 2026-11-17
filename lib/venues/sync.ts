import type { CostItem, VatTreatment } from "@/lib/venues/analysis/types";
import type { CostPatch } from "@/lib/venues/costs/schema";
import type { UpdateKind, VenueDetailsFields } from "./types";

/**
 * Four prices exist twice: as the original flat columns on venue_details and
 * as cost lines. Cost lines are canonical (they carry VAT, source and
 * confidence); the flat columns are kept in step so the original editor, the
 * "quoted facts" table and the venue cards never disagree with them. Pure:
 * the callers do the reading and writing.
 */
const LINK = {
  venue_hire: "rentalFeeSaturday",
  adult_menu: "pricePerPerson",
  additional_bar_hours: "extraBarHourCost",
  wedding_coordinator: "coordinationCost",
} as const;

type LegacyAmountField = (typeof LINK)[keyof typeof LINK];
export const SYNCED_COST_KEYS = Object.keys(LINK);

const vatFromFlag = (flag: boolean | null): VatTreatment => (flag === null ? "unknown" : flag ? "included" : "excluded");
const flagFromVat = (vat: VatTreatment): boolean | null => (vat === "unknown" ? null : vat === "included");

/** The flat columns implied by these cost lines (only those lines are mentioned). */
export function legacyPatchFromCostItems(items: CostItem[]): Partial<VenueDetailsFields> {
  const patch: Partial<VenueDetailsFields> = {};
  for (const item of items) {
    const field = LINK[item.itemKey as keyof typeof LINK] as LegacyAmountField | undefined;
    if (!field) continue;
    // The legacy price is per person, so only a per-adult menu line maps onto it.
    if (item.itemKey === "adult_menu" && item.basis !== "per_adult") continue;
    patch[field] = item.amount;
    if (item.itemKey === "venue_hire") patch.feeIncludesVat = flagFromVat(item.vat);
  }
  return patch;
}

const same = (a: unknown, b: unknown) => (a ?? null) === (b ?? null);

/**
 * Cost-line patches for the flat fields that actually changed, so saving the
 * original form updates the canonical lines without overwriting richer data
 * (source, confidence, notes, ranges) on lines whose value didn't move.
 */
export function costPatchesFromLegacyChange(
  previous: VenueDetailsFields | null,
  next: VenueDetailsFields,
  entry: { kind: UpdateKind; date: string },
): CostPatch[] {
  const patches: CostPatch[] = [];
  // A reply states a price; anything else just records one, so don't claim confirmation.
  const provenance =
    entry.kind === "reply"
      ? ({ source: "email", confidence: "confirmed_by_venue", sourceDate: entry.date } as const)
      : entry.kind === "visit" || entry.kind === "call"
        ? ({ confidence: "confirmed_by_venue", sourceDate: entry.date } as const)
        : {};

  for (const [itemKey, field] of Object.entries(LINK) as [keyof typeof LINK, LegacyAmountField][]) {
    const amountChanged = !same(previous?.[field], next[field]);
    const vatChanged = itemKey === "venue_hire" && !same(previous?.feeIncludesVat, next.feeIncludesVat);
    if (!amountChanged && !vatChanged) continue;

    patches.push({
      itemKey,
      ...(amountChanged ? { amount: next[field], ...(next[field] === null ? {} : provenance) } : {}),
      ...(vatChanged ? { vat: vatFromFlag(next.feeIncludesVat) } : {}),
      ...(itemKey === "adult_menu" && amountChanged ? { basis: "per_adult" as const } : {}),
    });
  }
  return patches;
}
