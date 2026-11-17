import { describe, expect, it, vi } from "vitest";
import { callTool, db, withTestDatabase } from "./helpers/harness";

withTestDatabase();

const without = <T extends Record<string, unknown>>(value: T, ...keys: string[]) =>
  Object.fromEntries(Object.entries(value).filter(([key]) => !keys.includes(key)));

async function newVenue(name: string) {
  const created = await callTool("create_vendor", {
    category: "venue",
    name,
    contactName: "Original Contact",
    email: "hello@venue.example",
    phone: "+39 000",
    website: "https://venue.example",
    priceQuote: 5000,
    notes: "Original notes: keep me",
  });
  expect(created.isError, created.text).toBe(false);
  return created.data.id as string;
}

describe("updating one thing leaves everything else alone, and the update is readable straight away", () => {
  it("vendor: changing the phone keeps every other field and the notes", async () => {
    const id = await newVenue("Vendor Preservation");
    const before = (await callTool("get_vendor", { vendorId: id })).data.vendor;

    expect((await callTool("update_vendor", { vendorId: id, phone: "+39 111" })).isError).toBe(false);
    const after = (await callTool("get_vendor", { vendorId: id })).data.vendor;

    expect(after.phone).toBe("+39 111");
    expect(without(after, "phone", "updatedAt")).toEqual(without(before, "phone", "updatedAt"));
  });

  it("venue details: changing one field keeps the rest, including notes-like text fields", async () => {
    const id = await newVenue("Details Preservation");
    await callTool("update_venue_details", {
      vendorId: id,
      fields: {
        availableDates: "Sat 2 Sep",
        maxCapacity: 200,
        otherCosts: "Long free text about extras",
        musicCurfew: "02:00",
        cateringType: "in_house",
        depositAmount: 1500,
        minGuests: 0,
      },
    });
    const before = (await callTool("get_venue_record", { vendorId: id })).data.venueDetails;

    const write = await callTool("update_venue_details", { vendorId: id, fields: { minSpend: 8000 } });
    expect(write.isError, write.text).toBe(false);
    const after = (await callTool("get_venue_record", { vendorId: id })).data.venueDetails;

    expect(after.minSpend).toBe(8000);
    expect(without(after, "minSpend", "updatedAt")).toEqual(without(before, "minSpend", "updatedAt"));
    // A zero is a real answer ("no minimum"), not "unknown".
    expect(after.minGuests).toBe(0);
  });

  it("cost lines: changing one line keeps the others and their notes", async () => {
    const id = await newVenue("Costs Preservation");
    await callTool("update_venue_costs", {
      vendorId: id,
      items: [
        { itemKey: "ceremony_fee", amount: 1000, vat: "unknown", notes: "excluding flowers", source: "email", confidence: "confirmed_by_venue" },
        { itemKey: "dj", amount: 900, requirement: "optional", notes: "approx" },
      ],
    });
    const before = (await callTool("get_venue_record", { vendorId: id })).data.costItems;
    await callTool("update_venue_costs", { vendorId: id, items: [{ itemKey: "dj", amount: 1000 }] });
    const after = (await callTool("get_venue_record", { vendorId: id })).data.costItems;

    const byKey = (items: { itemKey: string; amount?: number; notes?: string | null }[]) => Object.fromEntries(items.map((item) => [item.itemKey, item]));
    expect(byKey(after).ceremony_fee).toEqual(byKey(before).ceremony_fee);
    expect(byKey(after).dj.amount).toBe(1000);
    expect(byKey(after).dj.notes).toBe("approx");
  });

  it("services: changing one keeps the others", async () => {
    const id = await newVenue("Services Preservation");
    await callTool("update_venue_services", {
      vendorId: id,
      services: [
        { serviceKey: "catering", status: "not_provided", notes: "approved list" },
        { serviceKey: "security", status: "included" },
      ],
    });
    await callTool("update_venue_services", { vendorId: id, services: [{ serviceKey: "security", status: "additional" }] });
    const services = (await callTool("get_venue_record", { vendorId: id })).data.services as { serviceKey: string; status: string; notes: string | null }[];
    expect(services.find((s) => s.serviceKey === "catering")).toMatchObject({ status: "not_provided", notes: "approved list" });
    expect(services.find((s) => s.serviceKey === "security")?.status).toBe("additional");
  });

  it("budget: recording the actual spend keeps the name, category, notes and budgeted amount", async () => {
    const added = await callTool("add_budget_item", { name: "Cake", category: "cake_desserts", budgetedAmount: 400, notes: "tasting booked" });
    expect(added.isError, added.text).toBe(false);
    const id = added.data.id as string;
    expect((await callTool("update_budget_item", { itemId: id, actualAmount: 380 })).isError).toBe(false);

    const items = (await callTool("list_budget_items", { category: "cake_desserts" })).data as unknown as { id: string }[];
    expect(items.find((item) => item.id === id)).toMatchObject({
      name: "Cake",
      category: "cake_desserts",
      budgetedAmount: 400,
      actualAmount: 380,
      notes: "tasting booked",
    });
  });

  it("checklist: completing a task keeps its title, notes and phase; editing notes keeps it complete", async () => {
    const added = await callTool("add_checklist_item", { title: "Book flights", phaseId: "core_vendors", description: "Seville" });
    const id = added.data.id as string;
    await callTool("update_checklist_item", { itemId: id, isComplete: true });
    await callTool("update_checklist_item", { itemId: id, description: "Seville, direct from Amsterdam" });

    const phases = (await callTool("list_checklist", { status: "all" })).data as unknown as { items: { id: string; title: string; description: string; isComplete: boolean }[] }[];
    const item = phases.flatMap((phase) => phase.items).find((entry) => entry.id === id);
    expect(item).toMatchObject({ title: "Book flights", description: "Seville, direct from Amsterdam", isComplete: true });
  });

  it("values persist for a new session: reload the modules and read again from the same database", async () => {
    const id = await newVenue("Persistence");
    await callTool("update_venue_profile", { vendorId: id, dogPolicy: "limited", address: "1 Test Street" });
    await callTool("update_venue_details", { vendorId: id, fields: { feeIncludesVat: null, rentalFeeSaturday: 3000 } });

    const first = (await callTool("get_venue_record", { vendorId: id })).data;
    vi.resetModules(); // a new server instance: no module-level state survives
    const second = (await callTool("get_venue_record", { vendorId: id })).data;

    expect(second.profile.dogPolicy).toBe("limited");
    expect(second.profile.address).toBe("1 Test Street");
    expect(second.venueDetails.feeIncludesVat).toBeNull();
    expect(without(second, "history")).toEqual(without(first, "history"));
    const { rows } = await db.query("select dog_policy, address from venue_profile where vendor_id = $1", [id]);
    expect(rows[0]).toEqual({ dog_policy: "limited", address: "1 Test Street" });
  });
});
