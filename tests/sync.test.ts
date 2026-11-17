import { describe, expect, it } from "vitest";
import { hireInclVat } from "@/lib/venues/pricing";
import { fieldsToForm, emptyVenueFields } from "@/lib/venues/schema";
import { callTool, db, withTestDatabase } from "./helpers/harness";

withTestDatabase();

async function newVenue(name: string) {
  return (await callTool("create_vendor", { category: "venue", name })).data.id as string;
}
const details = async (id: string) => (await db.query("select * from venue_details where vendor_id = $1", [id])).rows[0] as Record<string, unknown>;
const cost = async (id: string, key: string) =>
  (await db.query("select * from venue_cost_items where vendor_id = $1 and item_key = $2", [id, key])).rows[0] as Record<string, unknown> | undefined;

describe("the price stored in two places stays in step (cost lines are canonical)", () => {
  it("a cost line updates the original flat column, including a 'not stated' VAT", async () => {
    const id = await newVenue("Cost to legacy");
    await callTool("update_venue_costs", { vendorId: id, items: [{ itemKey: "venue_hire", amount: 3000, vat: "unknown" }] });
    expect(await details(id)).toMatchObject({ rental_fee_saturday: 3000, fee_includes_vat: null });

    await callTool("update_venue_costs", { vendorId: id, items: [{ itemKey: "venue_hire", vat: "excluded" }] });
    expect(await details(id)).toMatchObject({ rental_fee_saturday: 3000, fee_includes_vat: false });

    await callTool("update_venue_costs", { vendorId: id, items: [{ itemKey: "venue_hire", vat: "included" }] });
    expect((await details(id)).fee_includes_vat).toBe(true);

    await callTool("update_venue_costs", {
      vendorId: id,
      items: [
        { itemKey: "adult_menu", amount: 110, basis: "per_adult" },
        { itemKey: "additional_bar_hours", amount: 700, basis: "per_hour" },
        { itemKey: "wedding_coordinator", amount: 1500 },
      ],
    });
    expect(await details(id)).toMatchObject({ price_per_person: 110, extra_bar_hour_cost: 700, coordination_cost: 1500 });
  });

  it("saving the flat fields updates the cost lines, and leaves richer line data alone when the value didn't change", async () => {
    const id = await newVenue("Legacy to cost");
    await callTool("update_venue_costs", {
      vendorId: id,
      items: [
        { itemKey: "adult_menu", amount: 130, basis: "per_adult", vat: "included", notes: "Menu A", source: "email", confidence: "confirmed_by_venue" },
        { itemKey: "ceremony_fee", amount: 1000, notes: "excluding flowers" },
      ],
    });

    await callTool("update_venue_details", { vendorId: id, fields: { rentalFeeSaturday: 2000, feeIncludesVat: true } });
    expect(await cost(id, "venue_hire")).toMatchObject({ amount: 2000, vat: "included" });

    // Only the menu price moves; its VAT, notes and source stay, and unrelated lines are untouched.
    await callTool("update_venue_details", { vendorId: id, fields: { pricePerPerson: 140 } });
    expect(await cost(id, "adult_menu")).toMatchObject({ amount: 140, vat: "included", notes: "Menu A", source: "email" });
    expect(await cost(id, "ceremony_fee")).toMatchObject({ amount: 1000, notes: "excluding flowers" });

    await callTool("update_venue_details", { vendorId: id, fields: { feeIncludesVat: null } });
    expect(await cost(id, "venue_hire")).toMatchObject({ amount: 2000, vat: "unknown" });
  });

  it("the audit catches two different prices, and re-saving the canonical line realigns them (the El 29 case)", async () => {
    const id = await newVenue("El 29 style drift");
    // Reproduce production: legacy 125, cost line 130, written independently.
    await db.query("insert into venue_details (vendor_id, price_per_person) values ($1, 125) on conflict (vendor_id) do update set price_per_person = 125", [id]);
    await db.query("insert into venue_cost_items (vendor_id, item_key, amount, basis, requirement) values ($1, 'adult_menu', 130, 'per_adult', 'mandatory')", [id]);

    const before = (await callTool("audit_venue_data", { vendorId: id })).data as unknown as { findings: { field: string; severity: string; message: string }[] }[];
    expect(before[0].findings.find((f) => f.field === "pricePerPerson")).toMatchObject({ severity: "error" });

    await callTool("update_venue_costs", { vendorId: id, items: [{ itemKey: "adult_menu", amount: 130 }] });
    expect((await details(id)).price_per_person).toBe(130);
    const after = (await callTool("audit_venue_data", { vendorId: id })).data as unknown as { findings: { field: string }[] }[];
    expect(after[0].findings.map((f) => f.field)).not.toContain("pricePerPerson");
  });
});

describe("VAT: 'not stated' is its own answer and is never turned into 'excluded'", () => {
  it("is stored as null, read back as null, and not charged on top", async () => {
    const id = await newVenue("VAT unknown");
    await callTool("update_venue_details", { vendorId: id, fields: { rentalFeeSaturday: 3000 } });
    const record = (await callTool("get_venue_record", { vendorId: id })).data;
    expect(record.venueDetails.feeIncludesVat).toBeNull();
    expect(hireInclVat(record.venueDetails)).toBe(3000);
    expect(hireInclVat({ ...record.venueDetails, feeIncludesVat: false })).toBeCloseTo(3630);
    expect(hireInclVat({ ...record.venueDetails, feeIncludesVat: true })).toBe(3000);
  });

  it("the original form round-trips all three answers", () => {
    expect(fieldsToForm({ ...emptyVenueFields(), feeIncludesVat: null }).feeIncludesVat).toBe("");
    expect(fieldsToForm({ ...emptyVenueFields(), feeIncludesVat: true }).feeIncludesVat).toBe("yes");
    expect(fieldsToForm({ ...emptyVenueFields(), feeIncludesVat: false }).feeIncludesVat).toBe("no");
  });
});
