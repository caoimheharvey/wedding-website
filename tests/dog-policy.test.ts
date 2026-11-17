import { describe, expect, it } from "vitest";
import { buildDecisionData } from "@/lib/venues/analysis/decision";
import { loadVenueDecisionInputs } from "@/lib/venues/analysis/load";
import { describeDogPolicy } from "@/lib/venues/analysis/types";
import { seedVenues, type VenueKey } from "./helpers/fixtures";
import { callTool, db, withTestDatabase } from "./helpers/harness";

withTestDatabase();

// The classification supplied for the shortlist. Hotel La Tonnara's pet policy
// covers the hotel stay only; wedding-event access is not confirmed.
const EXPECTED: Record<VenueKey, { dogPolicy: string; dogAccommodation: string; summary: string }> = {
  palm: { dogPolicy: "welcome", dogAccommodation: "limited", summary: "Welcome at the wedding; limited for accommodation" },
  baglio: { dogPolicy: "welcome", dogAccommodation: "welcome", summary: "Welcome at the wedding; welcome for accommodation" },
  cantine: { dogPolicy: "welcome", dogAccommodation: "unknown", summary: "Welcome" },
  el29: { dogPolicy: "limited", dogAccommodation: "unknown", summary: "Limited" },
  tonnara: {
    dogPolicy: "unknown",
    dogAccommodation: "welcome",
    summary: "Welcome for accommodation; wedding-event access unconfirmed",
  },
};

describe("dog policy is a structured field (regression for the 'Unknown' bug)", () => {
  let ids: Record<VenueKey, string>;

  it("reproduces the reported state: the answer is in the notes, the structured field says Unknown", async () => {
    ids = await seedVenues(db);
    for (const id of Object.values(ids)) {
      const record = (await callTool("get_venue_record", { vendorId: id })).data;
      expect(record.vendor.notes).toMatch(/^Dog policy:/);
      expect(record.profile.dogPolicy).toBe("unknown");
      expect(record.dogPolicySummary).toBe("Unknown");
      // ...and the audit catches exactly that drift.
      expect(record.auditFindings.map((f: { field: string }) => f.field)).toContain("dogPolicy");
    }
  });

  it("writing the structured field through the API shows up on the next read", async () => {
    for (const [key, expected] of Object.entries(EXPECTED) as [VenueKey, (typeof EXPECTED)[VenueKey]][]) {
      const write = await callTool("update_venue_profile", {
        vendorId: ids[key],
        dogPolicy: expected.dogPolicy,
        dogAccommodation: expected.dogAccommodation,
      });
      expect(write.isError, write.text).toBe(false);

      const record = (await callTool("get_venue_record", { vendorId: ids[key] })).data;
      expect(record.profile.dogPolicy).toBe(expected.dogPolicy);
      expect(record.profile.dogAccommodation).toBe(expected.dogAccommodation);
      expect(record.dogPolicySummary).toBe(expected.summary);
      // The same value comes back from get_vendor, the tool assistants reach for first.
      const viaVendor = (await callTool("get_vendor", { vendorId: ids[key] })).data;
      expect(viaVendor.profile.dogPolicy).toBe(expected.dogPolicy);
    }
  });

  it("the data the website renders from carries the same values, and Unknown only appears for the genuinely unknown", async () => {
    const data = buildDecisionData(await loadVenueDecisionInputs(), 80);
    for (const [key, expected] of Object.entries(EXPECTED) as [VenueKey, (typeof EXPECTED)[VenueKey]][]) {
      const facts = data.facts[ids[key]];
      expect(facts.dogPolicy).toBe(expected.dogPolicy);
      expect(facts.dogSummary).toBe(expected.summary);
      expect(facts.dogSummary).not.toBe("Unknown");
    }
  });

  it("Hotel La Tonnara never implies the dog may attend the wedding", async () => {
    const summary = (await callTool("get_venue_record", { vendorId: ids.tonnara })).data.dogPolicySummary as string;
    expect(summary).toContain("accommodation");
    expect(summary).toContain("wedding-event access unconfirmed");
    expect(summary.toLowerCase()).not.toMatch(/^welcome( at the wedding)?$/);
  });

  it("editing the vendor notes does not touch the structured policy", async () => {
    const edit = await callTool("update_vendor", { vendorId: ids.el29, notes: "Dog policy: rewritten text only" });
    expect(edit.isError, edit.text).toBe(false);
    const record = (await callTool("get_venue_record", { vendorId: ids.el29 })).data;
    expect(record.vendor.notes).toBe("Dog policy: rewritten text only");
    expect(record.profile.dogPolicy).toBe("limited");
  });

  it("updating other profile fields keeps the dog policy, and updating the policy keeps the other fields", async () => {
    await callTool("update_venue_profile", { vendorId: ids.palm, address: "Strada Statale 113 n°14, Casteldaccia", dogNotes: "Ceremony and photos; couple's room" });
    await callTool("update_venue_profile", { vendorId: ids.palm, location: "Casteldaccia, Sicily" });
    let profile = (await callTool("get_venue_record", { vendorId: ids.palm })).data.profile;
    expect(profile.dogPolicy).toBe("welcome");
    expect(profile.dogAccommodation).toBe("limited");
    expect(profile.address).toBe("Strada Statale 113 n°14, Casteldaccia");
    expect(profile.dogNotes).toBe("Ceremony and photos; couple's room");

    await callTool("update_venue_profile", { vendorId: ids.palm, dogPolicy: "limited" });
    profile = (await callTool("get_venue_record", { vendorId: ids.palm })).data.profile;
    expect(profile.dogPolicy).toBe("limited");
    expect(profile.location).toBe("Casteldaccia, Sicily");
    expect(profile.address).toBe("Strada Statale 113 n°14, Casteldaccia");
    expect(profile.dogNotes).toBe("Ceremony and photos; couple's room");
  });

  it("the old vocabulary and free text are rejected rather than stored", async () => {
    for (const value of ["allowed_all_day", "ceremony_only", "yes", "Welcome"]) {
      const result = await callTool("update_venue_profile", { vendorId: ids.baglio, dogPolicy: value });
      expect(result.isError, value).toBe(true);
    }
    const { rows } = await db.query("select dog_policy from venue_profile where vendor_id = $1", [ids.baglio]);
    expect(rows[0]).toEqual({ dog_policy: "welcome" });
  });

  it("the database itself refuses values outside the vocabulary", async () => {
    await expect(db.query("update venue_profile set dog_policy = 'allowed_all_day' where vendor_id = $1", [ids.baglio])).rejects.toThrow();
  });

  it("describeDogPolicy shows Unknown only when nothing is known", () => {
    expect(describeDogPolicy({ policy: "unknown" })).toBe("Unknown");
    expect(describeDogPolicy({ policy: "welcome" })).toBe("Welcome");
    expect(describeDogPolicy({ policy: "not_allowed", accommodation: "welcome" })).toBe("Not allowed at the wedding; welcome for accommodation");
    expect(describeDogPolicy({ policy: "unknown", accommodation: "limited" })).toContain("event access unconfirmed");
  });
});
