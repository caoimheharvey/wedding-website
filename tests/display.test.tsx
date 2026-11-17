import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { VendorCard } from "@/app/admin/(dashboard)/vendors/[category]/_components/vendor-card";
import { VenueComparison } from "@/app/admin/(dashboard)/vendors/[category]/_components/venue-comparison";
import {
  VenueDecisionDashboard,
  matchesDogFilter,
} from "@/app/admin/(dashboard)/vendors/[category]/_components/venue-decision-dashboard";
import { buildDecisionData } from "@/lib/venues/analysis/decision";
import { loadVenueDecisionInputs } from "@/lib/venues/analysis/load";
import { listVenueProfiles } from "@/lib/venues/costs/queries";
import { listVenueDetails } from "@/lib/venues/queries";
import { listVendorsByCategory } from "@/lib/vendors/queries";
import { seedVenues, type VenueKey } from "./helpers/fixtures";
import { callTool, db, withTestDatabase } from "./helpers/harness";

// The card's server actions pull in auth; the display tests only need them to exist.
vi.mock("@/lib/vendors/actions", () => ({
  deleteVendor: vi.fn(),
  setVendorSelected: vi.fn(),
  updateBookingStatus: vi.fn(),
}));

withTestDatabase();

const rowFor = (html: string, name: string) => html.split("<tr").find((row) => row.includes(name)) ?? "";
// React puts <!-- --> between adjacent text nodes; strip them so assertions read like the page.
const decode = (html: string) => html.replace(/<!-- -->/g, "").replace(/&amp;/g, "&").replace(/&#x27;/g, "'");

describe("structured values reach the cards, comparison, dashboard and filters", async () => {
  let ids: Record<VenueKey, string>;

  it("set up: the shortlist with the supplied dog classifications written through the API", async () => {
    ids = await seedVenues(db);
    const policies: Record<VenueKey, [string, string]> = {
      palm: ["welcome", "limited"],
      baglio: ["welcome", "welcome"],
      cantine: ["welcome", "unknown"],
      el29: ["limited", "unknown"],
      tonnara: ["unknown", "welcome"],
    };
    for (const [key, [dogPolicy, dogAccommodation]] of Object.entries(policies)) {
      expect((await callTool("update_venue_profile", { vendorId: ids[key as VenueKey], dogPolicy, dogAccommodation })).isError).toBe(false);
    }
    // A sixth venue where nothing is known.
    const { rows } = await db.query<{ id: string }>("insert into vendors (category, name) values ('venue', 'Nothing Known Yet') returning id");
    await db.query("insert into venue_profile (vendor_id) values ($1)", [rows[0].id]);
  });

  it("the dashboard shows each venue's dog policy, with Unknown only where nothing is known", async () => {
    const html = decode(renderToString(<VenueDecisionDashboard venues={await loadVenueDecisionInputs()} category="venue" />));
    expect(rowFor(html, "PALM Beach Banqueting")).toContain("Welcome at the wedding; limited for accommodation");
    expect(rowFor(html, "Baglio Oneto")).toContain("Welcome at the wedding; welcome for accommodation");
    expect(rowFor(html, "Cantine De Gregorio")).toMatch(/>Welcome</);
    expect(rowFor(html, "El 29")).toMatch(/>Limited</);
    expect(rowFor(html, "Hotel La Tonnara")).toContain("Welcome for accommodation; wedding-event access unconfirmed");
    expect(rowFor(html, "Nothing Known Yet")).toMatch(/>Unknown</);
    for (const known of ["PALM Beach Banqueting", "Baglio Oneto", "Cantine De Gregorio", "El 29", "Hotel La Tonnara"]) {
      expect(rowFor(html, known), `${known} must not say Unknown for dogs`).not.toMatch(/>Unknown</);
    }
  });

  it("the venue cards show the structured dog policy and address, not just the notes", async () => {
    const [vendors, details, profiles] = await Promise.all([listVendorsByCategory("venue"), listVenueDetails(), listVenueProfiles()]);
    await callTool("update_venue_profile", { vendorId: ids.tonnara, address: "Largo Tonnara, snc, Trabia (PA)" });
    const profile = (await listVenueProfiles()).find((entry) => entry.vendorId === ids.tonnara)!;
    const vendor = vendors.find((entry) => entry.id === ids.tonnara)!;

    const card = decode(
      renderToString(
        <VendorCard
          vendor={vendor}
          category="venue"
          categoryBudgeted={0}
          isComparing={false}
          onToggleCompare={() => {}}
          compareDisabled={false}
          venueDetails={details.find((entry) => entry.vendorId === ids.tonnara) ?? null}
          venueProfile={profile}
        />,
      ),
    );
    expect(card).toContain("Dogs:");
    expect(card).toContain("Welcome for accommodation; wedding-event access unconfirmed");
    expect(card).toContain("Largo Tonnara, snc, Trabia (PA)");
    expect(card).toContain("line-clamp-3"); // long notes are trimmed on the card
    expect(profiles.length).toBeGreaterThan(0);
  });

  it("the comparison table has Dog policy and Address rows fed by the structured fields", async () => {
    const [vendors, details, profiles] = await Promise.all([listVendorsByCategory("venue"), listVenueDetails(), listVenueProfiles()]);
    const html = decode(
      renderToString(
        <VenueComparison
          venues={vendors}
          detailsByVendorId={Object.fromEntries(details.map((entry) => [entry.vendorId, entry]))}
          profilesByVendorId={Object.fromEntries(profiles.map((entry) => [entry.vendorId, entry]))}
          category="venue"
        />,
      ),
    );
    expect(html).toContain("Dog policy");
    expect(html).toContain("Address");
    expect(html).toContain("Welcome for accommodation; wedding-event access unconfirmed");
    expect(html).toContain("Limited");
  });

  it("the dog filter works on the structured fields", async () => {
    const data = buildDecisionData(await loadVenueDecisionInputs(), 80);
    const names = (filter: Parameters<typeof matchesDogFilter>[1]) =>
      data.analyses.filter((a) => matchesDogFilter(data.facts[a.vendorId], filter)).map((a) => a.name).sort();
    expect(names("welcome")).toEqual(["Baglio Oneto Luxury Wine Resort", "Cantine De Gregorio", "PALM Beach Banqueting"]);
    expect(names("limited")).toEqual(["El 29"]);
    expect(names("unknown")).toEqual(["Hotel La Tonnara", "Nothing Known Yet"]);
    expect(names("pet_friendly_stay")).toEqual(["Baglio Oneto Luxury Wine Resort", "Hotel La Tonnara"]);
    expect(names("any")).toHaveLength(6);
  });

  it("a hire fee with no stated VAT treatment is never shown with VAT added", async () => {
    await callTool("update_venue_details", { vendorId: ids.cantine, fields: { rentalFeeSaturday: 3000 } });
    const [vendors, details, profiles] = await Promise.all([listVendorsByCategory("venue"), listVenueDetails(), listVenueProfiles()]);
    const vendor = vendors.find((entry) => entry.id === ids.cantine)!;
    const card = decode(
      renderToString(
        <VendorCard
          vendor={vendor}
          category="venue"
          categoryBudgeted={0}
          isComparing={false}
          onToggleCompare={() => {}}
          compareDisabled={false}
          venueDetails={details.find((entry) => entry.vendorId === ids.cantine) ?? null}
          venueProfile={profiles.find((entry) => entry.vendorId === ids.cantine) ?? null}
        />,
      ),
    );
    expect(card).toContain("€3,000");
    expect(card).toContain("VAT not stated");
    expect(card).not.toContain("3,630");
  });
});
