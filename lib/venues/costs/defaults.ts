import { COST_ITEM_BY_KEY } from "@/lib/venues/analysis/catalogue";
import type { CostItem, ServiceEntry, VenueProfile } from "@/lib/venues/analysis/types";

/** What a cost line looks like before anyone has entered anything: unpriced, unknown. */
export function defaultCostItem(vendorId: string, itemKey: string): CostItem {
  const def = COST_ITEM_BY_KEY.get(itemKey);
  return {
    vendorId,
    itemKey,
    amount: null,
    amountHigh: null,
    currency: "EUR",
    basis: def?.basis ?? "fixed",
    quantity: null,
    requirement: def?.core || itemKey === "adult_menu" ? "mandatory" : "optional",
    inclusion: "additional",
    vat: "unknown",
    source: null,
    confidence: "unknown",
    sourceDate: null,
    inTotal: true,
    scenarioOverride: null,
    notes: null,
  };
}

export function defaultService(vendorId: string, serviceKey: string): ServiceEntry {
  return {
    vendorId,
    serviceKey,
    status: "unknown",
    costItemKey: null,
    confidence: "unknown",
    source: null,
    sourceDate: null,
    notes: null,
  };
}

export function defaultProfile(vendorId: string): VenueProfile {
  return {
    vendorId,
    location: null,
    address: null,
    ceremonyCapacity: null,
    receptionCapacity: null,
    partyCapacity: null,
    spaceNotes: null,
    dogPolicy: "unknown",
    dogAccommodation: "unknown",
    dogNotes: null,
    directFlightAmsterdam: "unknown",
    logisticsNotes: null,
    englishSupport: "unknown",
    evaluationNotes: null,
    outstandingQuestions: null,
    fieldMeta: {},
  };
}
