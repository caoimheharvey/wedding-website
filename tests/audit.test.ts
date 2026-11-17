import { describe, expect, it } from "vitest";
import { auditVenueRecord, type VenueAuditInput } from "@/lib/venues/audit";
import { defaultCostItem, defaultProfile, defaultService } from "@/lib/venues/costs/defaults";
import { emptyVenueFields } from "@/lib/venues/schema";

const ID = "00000000-0000-4000-8000-000000000001";

function input(overrides: Partial<VenueAuditInput> & { notes?: string } = {}): VenueAuditInput {
  const { notes, ...rest } = overrides;
  return {
    vendor: { id: ID, name: "V", contactName: null, email: null, phone: null, website: null, notes: notes ?? null },
    details: { vendorId: ID, updatedAt: "", ...emptyVenueFields() },
    profile: defaultProfile(ID),
    costItems: [],
    services: [],
    ...rest,
  };
}
const fields = (findings: { field: string }[]) => findings.map((f) => f.field);

describe("auditVenueRecord reports drift without deciding who is right", () => {
  it("is quiet for a venue whose structured fields are all in step", () => {
    expect(auditVenueRecord(input())).toEqual([]);
  });

  it("flags facts that exist only in notes", () => {
    const findings = auditVenueRecord(
      input({
        notes:
          "Dog policy: dogs permitted at the ceremony.\nFULL VENUE ADDRESS: Largo Tonnara, Trabia\nOfficial website: https://hotel.example/\n- Contact: Sandra Rollán; email not captured.\n- English support confirmed.",
      }),
    );
    expect(fields(findings)).toEqual(expect.arrayContaining(["dogPolicy", "address", "contactName", "website", "englishSupport"]));
  });

  it("is satisfied once the structured fields are filled", () => {
    const findings = auditVenueRecord(
      input({
        notes: "Dog policy: dogs permitted.\nFULL VENUE ADDRESS: Somewhere 1",
        profile: { ...defaultProfile(ID), dogPolicy: "welcome", address: "Somewhere 1" },
      }),
    );
    expect(fields(findings)).toEqual([]);
  });

  it("flags the same price stored twice with different values, and a price recorded in only one place", () => {
    const details = { vendorId: ID, updatedAt: "", ...emptyVenueFields(), pricePerPerson: 125, rentalFeeSaturday: 3000 };
    const findings = auditVenueRecord(
      input({ details, costItems: [{ ...defaultCostItem(ID, "adult_menu"), amount: 130, basis: "per_adult" }] }),
    );
    expect(findings.find((f) => f.field === "pricePerPerson")).toMatchObject({ severity: "error" });
    expect(findings.find((f) => f.field === "rentalFeeSaturday")).toMatchObject({ severity: "warning" });
  });

  it("flags VAT that contradicts between copies or contradicts the notes", () => {
    const details = { vendorId: ID, updatedAt: "", ...emptyVenueFields(), rentalFeeSaturday: 3000, feeIncludesVat: false };
    const hire = { ...defaultCostItem(ID, "venue_hire"), amount: 3000, vat: "unknown" as const };
    const mismatch = auditVenueRecord(input({ details, costItems: [hire] }));
    expect(mismatch.find((f) => f.field === "feeIncludesVat")).toMatchObject({ severity: "error" });

    const contradictsNotes = auditVenueRecord(
      input({ details, costItems: [{ ...hire, vat: "excluded" }], notes: "VAT and service charges unconfirmed." }),
    );
    expect(contradictsNotes.find((f) => f.field === "feeIncludesVat")).toMatchObject({ severity: "warning" });
  });

  it("flags structured fields that contradict the services checklist", () => {
    const details = { vendorId: ID, updatedAt: "", ...emptyVenueFields(), onsiteAccommodation: true, cateringType: "in_house" as const, setupTeardownIncluded: null };
    const findings = auditVenueRecord(
      input({
        details,
        services: [
          { ...defaultService(ID, "accommodation"), status: "not_provided" },
          { ...defaultService(ID, "catering"), status: "not_provided" },
          { ...defaultService(ID, "setup"), status: "included" },
        ],
      }),
    );
    expect(fields(findings)).toEqual(expect.arrayContaining(["onsiteAccommodation", "cateringType", "setupTeardownIncluded"]));
  });
});
