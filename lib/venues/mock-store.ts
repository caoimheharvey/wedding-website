import "server-only";
import { SAN_MARCOS_VENDOR_ID } from "./seed-ids";
import { emptyVenueFields } from "./schema";
import type { VenueDetails, VenueDetailsFields, VenueDocument, VenueUpdate } from "./types";

/**
 * In-memory venue replies used only when LOCAL_TEST_BYPASS_AUTH is set.
 * Resets on every dev server restart — intentional, no persistence needed.
 * Uploaded documents are kept as data URLs, like the site background image.
 */
let details: VenueDetails[] = seed();
let documents: VenueDocument[] = [];
let updates: VenueUpdate[] = seedUpdates();

function seed(): VenueDetails[] {
  const now = new Date().toISOString();
  return [
    {
      ...emptyVenueFields(),
      vendorId: SAN_MARCOS_VENDOR_ID,
      outreachStatus: "replied",
      availableDates: "Sat 2, 16, 23, 30 Sep; every Sat in Oct",
      exclusiveHire: true,
      maxCapacity: 300,
      hireHours: "24h, 07:00 to 07:00 next day",
      rentalFeeSaturday: 6000,
      feeIncludesVat: false,
      vatPercent: 21,
      otherCosts: "Security and cleaning included in the hire fee. Catering and DJ billed separately.",
      estimateNotes: "Fee doesn't vary with guest count; no total estimate since there's no in-house catering.",
      musicCurfew: "Music inside the wine cellar until 06:00",
      ceremonyOnSite: true,
      setupTeardownIncluded: false,
      cateringType: "approved_list",
      coordination: "none",
      onsiteAccommodation: false,
      accommodationNotes: "Hotels and holiday flats close by (city centre).",
      depositAmount: 1000,
      paymentSchedule: "€1,000 deposit with signed contract; up to 50% six months before; rest the week before.",
      updatedAt: now,
    },
  ];
}

function seedUpdates(): VenueUpdate[] {
  return [
    {
      id: crypto.randomUUID(),
      vendorId: SAN_MARCOS_VENDOR_ID,
      kind: "reply",
      occurredOn: "2026-10-28",
      rawText:
        "Alquiler siempre en exclusiva (24h, 7:00 a 7:00). Sábados y festivos: 6.000 € + 21 % IVA. Disponibles sábados 2, 16, 23 y 30 de septiembre y todos los de octubre. Catering: listado de empresas colaboradoras. Sin wedding planner. Señal 1.000 €; 50 % seis meses antes y 50 % la semana previa.",
      changes: [],
      createdAt: new Date().toISOString(),
    },
  ];
}

export function mockListVenueUpdates(vendorId: string): VenueUpdate[] {
  return updates
    .filter((entry) => entry.vendorId === vendorId)
    .sort((a, b) => b.occurredOn.localeCompare(a.occurredOn) || b.createdAt.localeCompare(a.createdAt));
}

export function mockAddVenueUpdate(entry: Omit<VenueUpdate, "id" | "createdAt">): void {
  updates = [...updates, { ...entry, id: crypto.randomUUID(), createdAt: new Date().toISOString() }];
}

export function mockListVenueDetails(): VenueDetails[] {
  return details;
}

export function mockGetVenueDetails(vendorId: string): VenueDetails | null {
  return details.find((entry) => entry.vendorId === vendorId) ?? null;
}

export function mockSaveVenueDetails(vendorId: string, fields: VenueDetailsFields): void {
  const next: VenueDetails = { ...fields, vendorId, updatedAt: new Date().toISOString() };
  details = details.some((entry) => entry.vendorId === vendorId)
    ? details.map((entry) => (entry.vendorId === vendorId ? next : entry))
    : [...details, next];
}

export function mockListVenueDocuments(vendorId: string): VenueDocument[] {
  return documents.filter((doc) => doc.vendorId === vendorId);
}

export function mockAddVenueDocument(vendorId: string, fileName: string, url: string): void {
  documents = [
    ...documents,
    { id: crypto.randomUUID(), vendorId, fileName, url, createdAt: new Date().toISOString() },
  ];
}

export function mockDeleteVenueDocument(id: string): void {
  documents = documents.filter((doc) => doc.id !== id);
}
