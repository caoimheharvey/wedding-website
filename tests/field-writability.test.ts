import { describe, expect, it } from "vitest";
import { saveVenueDetails } from "@/lib/venues/actions";
import { defaultCostItem, defaultProfile, defaultService } from "@/lib/venues/costs/defaults";
import { costPatchSchema, profilePatchSchema, servicePatchSchema } from "@/lib/venues/costs/schema";
import { emptyVenueFields, fieldsToForm, venueDetailsFormSchema } from "@/lib/venues/schema";
import type { VenueDetailsFields } from "@/lib/venues/types";
import { getVenueDetails } from "@/lib/venues/queries";
import { callTool, withTestDatabase } from "./helpers/harness";

withTestDatabase();

// Every field of the original venue form, with a value that can't be confused with a default.
const EVERY_DETAILS_FIELD: VenueDetailsFields = {
  outreachStatus: "replied",
  availableDates: "Sat 2 and 30 Sep",
  exclusiveHire: true,
  maxCapacity: 123,
  hireHours: "16:00 to 02:00",
  rentalFeeSaturday: 4000,
  feeIncludesVat: false,
  vatPercent: 10,
  pricePerPerson: 99,
  minSpend: 7000,
  minGuests: 55,
  otherCosts: "free text costs",
  estimateNotes: "estimate notes",
  barHoursIncluded: 3,
  extraBarHourCost: 11,
  musicCurfew: "03:00",
  ceremonyOnSite: true,
  setupTeardownIncluded: true,
  cateringType: "approved_list",
  coordination: "full",
  coordinationCost: 222,
  onsiteAccommodation: true,
  accommodationNotes: "rooms nearby",
  depositAmount: 333,
  paymentSchedule: "50% six months before",
  cancellationPolicy: "non-refundable",
};

describe("every field a form or tool shows can be written and read back", () => {
  it("the test covers every field of the original venue form (add a field, extend this list)", () => {
    expect(Object.keys(EVERY_DETAILS_FIELD).sort()).toEqual(Object.keys(emptyVenueFields()).sort());
    expect(Object.keys(venueDetailsFormSchema.shape).sort()).toEqual(Object.keys(fieldsToForm(emptyVenueFields())).sort());
  });

  it("the original venue form (saved the way the admin page saves it) persists every field", async () => {
    const id = (await callTool("create_vendor", { category: "venue", name: "Form writability" })).data.id as string;
    const form = new FormData();
    for (const [key, value] of Object.entries(fieldsToForm(EVERY_DETAILS_FIELD))) form.set(key, value);
    form.set("updateKind", "reply");
    form.set("updateDate", "2026-11-17");
    form.set("updateText", "pasted email");

    const state = await saveVenueDetails(id, "venue", undefined, form);
    expect(state?.errors, JSON.stringify(state)).toBeUndefined();

    const saved = await getVenueDetails(id);
    const { vendorId: _v, updatedAt: _u, ...fields } = saved!; // eslint-disable-line @typescript-eslint/no-unused-vars
    expect(fields).toEqual(EVERY_DETAILS_FIELD);
  });

  it("every profile field (address, dog policy, accommodation policy, …) is accepted by the API and read back", async () => {
    const id = (await callTool("create_vendor", { category: "venue", name: "Profile writability" })).data.id as string;
    const { vendorId: _v, ...profileKeys } = defaultProfile(id); // eslint-disable-line @typescript-eslint/no-unused-vars
    expect(Object.keys(profilePatchSchema.shape).sort()).toEqual(Object.keys(profileKeys).sort());

    const everything = {
      location: "Marsala",
      address: "Contrada Baronazzo Amafi 8, 91025 Marsala",
      ceremonyCapacity: 90,
      receptionCapacity: 170,
      partyCapacity: 120,
      spaceNotes: "Belvedere Garden",
      dogPolicy: "limited",
      dogAccommodation: "welcome",
      dogNotes: "ceremony and photos",
      directFlightAmsterdam: "yes",
      logisticsNotes: "Trapani 10 km",
      englishSupport: "confirmed",
      evaluationNotes: "strong",
      outstandingQuestions: "VAT?\nDeposit?",
      fieldMeta: { minGuests: { confidence: "confirmed_by_venue", source: "email", date: "2026-11-17" } },
    };
    const write = await callTool("update_venue_profile", { vendorId: id, ...everything });
    expect(write.isError, write.text).toBe(false);
    const profile = (await callTool("get_venue_record", { vendorId: id })).data.profile;
    expect(profile).toMatchObject(everything);
  });

  it("every cost-line field is accepted and read back", async () => {
    const id = (await callTool("create_vendor", { category: "venue", name: "Cost writability" })).data.id as string;
    const { vendorId: _v, itemKey: _k, ...lineKeys } = defaultCostItem(id, "dj"); // eslint-disable-line @typescript-eslint/no-unused-vars
    expect(Object.keys(costPatchSchema.shape).sort()).toEqual(["itemKey", ...Object.keys(lineKeys)].sort());

    const line = {
      itemKey: "dj",
      amount: 900,
      amountHigh: 1100,
      currency: "EUR",
      basis: "fixed",
      quantity: 2,
      requirement: "mandatory",
      inclusion: "additional",
      vat: "excluded",
      source: "brochure",
      confidence: "brochure",
      sourceDate: "2026-11-17",
      inTotal: false,
      scenarioOverride: "complete",
      notes: "approx",
    };
    const write = await callTool("update_venue_costs", { vendorId: id, items: [line] });
    expect(write.isError, write.text).toBe(false);
    const saved = ((await callTool("get_venue_record", { vendorId: id })).data.costItems as Record<string, unknown>[]).find((i) => i.itemKey === "dj");
    expect(saved).toMatchObject(line);
  });

  it("every service field is accepted and read back", async () => {
    const id = (await callTool("create_vendor", { category: "venue", name: "Service writability" })).data.id as string;
    const { vendorId: _v, serviceKey: _k, ...serviceKeys } = defaultService(id, "dj"); // eslint-disable-line @typescript-eslint/no-unused-vars
    expect(Object.keys(servicePatchSchema.shape).sort()).toEqual(["serviceKey", ...Object.keys(serviceKeys)].sort());

    const service = { serviceKey: "dj", status: "additional", costItemKey: "dj_equipment", confidence: "indicative", source: "email", sourceDate: "2026-11-17", notes: "extra" };
    expect((await callTool("update_venue_services", { vendorId: id, services: [service] })).isError).toBe(false);
    const saved = ((await callTool("get_venue_record", { vendorId: id })).data.services as Record<string, unknown>[]).find((s) => s.serviceKey === "dj");
    expect(saved).toMatchObject(service);
  });

  it("ratings are written and removing one only removes that one", async () => {
    const id = (await callTool("create_vendor", { category: "venue", name: "Rating writability" })).data.id as string;
    await callTool("rate_venue", { vendorId: id, ratings: [{ criterionKey: "atmosphere", score: 4.5, reasoning: "gardens" }, { criterionKey: "setting", score: 5 }] });
    await callTool("rate_venue", { vendorId: id, ratings: [{ criterionKey: "setting", score: null }] });
    const ratings = (await callTool("get_venue_record", { vendorId: id })).data.ratings as { criterionKey: string; score: number; reasoning: string }[];
    expect(ratings).toEqual([expect.objectContaining({ criterionKey: "atmosphere", score: 4.5, reasoning: "gardens" })]);
  });
});
