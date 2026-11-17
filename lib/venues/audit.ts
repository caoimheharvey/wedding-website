import type { CostItem, ServiceEntry, VenueProfile } from "@/lib/venues/analysis/types";
import type { VenueDetails } from "./types";

/**
 * Looks for the ways a venue record drifts: facts that live only in notes,
 * the same fact stored twice with different values, and structured fields
 * that contradict each other. Pure, so it can run in the app, in tests and
 * behind the MCP `audit_venue_data` tool. It reports; it never decides which
 * value is right.
 */
export interface VenueAuditInput {
  vendor: {
    id: string;
    name: string;
    contactName: string | null;
    email: string | null;
    phone: string | null;
    website: string | null;
    notes: string | null;
  };
  details: VenueDetails | null;
  profile: VenueProfile | null;
  costItems: CostItem[];
  services: ServiceEntry[];
}

export interface AuditFinding {
  severity: "error" | "warning";
  field: string;
  message: string;
}

const money = (value: number) => `€${value.toLocaleString("en-IE")}`;

export function auditVenueRecord(input: VenueAuditInput): AuditFinding[] {
  const { vendor, details, profile, costItems, services } = input;
  const findings: AuditFinding[] = [];
  const add = (severity: AuditFinding["severity"], field: string, message: string) =>
    findings.push({ severity, field, message });

  const notes = vendor.notes ?? "";
  const freeText = [notes, details?.otherCosts, details?.accommodationNotes, details?.estimateNotes]
    .filter(Boolean)
    .join("\n");
  const serviceStatus = (key: string) => services.find((entry) => entry.serviceKey === key)?.status ?? "unknown";
  const costLine = (key: string) => costItems.find((item) => item.itemKey === key);

  // 1. Facts that exist only as text.
  if (/\b(dogs?|pets?)\b/i.test(freeText) && (profile?.dogPolicy ?? "unknown") === "unknown" && (profile?.dogAccommodation ?? "unknown") === "unknown") {
    add("error", "dogPolicy", "The notes mention dogs/pets but the structured dog policy is still unknown.");
  }
  const address = /FULL VENUE ADDRESS:\s*(.+)/i.exec(notes)?.[1]?.trim();
  if (address && !profile?.address) add("error", "address", `The notes give an address ("${address}") but the structured address is empty.`);
  const contact = /(?:^|\n)\s*-?\s*Contact:\s*([^;,\n.]+)/i.exec(notes)?.[1]?.trim();
  if (contact && !vendor.contactName) add("warning", "contactName", `The notes name a contact ("${contact}") but the contact name field is empty.`);
  const website = /Official website:\s*\[?(https?:\/\/[^\s\])]+)/i.exec(notes)?.[1];
  if (website && !vendor.website) add("warning", "website", `The notes give a website (${website}) but the website field is empty.`);
  if (/English[^.\n]{0,40}\bconfirmed/i.test(freeText) && (profile?.englishSupport ?? "unknown") === "unknown") {
    add("warning", "englishSupport", "The notes say English support is confirmed but the structured field is unknown.");
  }

  // 2. The same price stored twice (flat columns vs canonical cost lines).
  const pairs: { line: string; field: keyof VenueDetails; label: string }[] = [
    { line: "venue_hire", field: "rentalFeeSaturday", label: "Saturday hire fee" },
    { line: "adult_menu", field: "pricePerPerson", label: "Price per person" },
    { line: "additional_bar_hours", field: "extraBarHourCost", label: "Extra bar hour" },
    { line: "wedding_coordinator", field: "coordinationCost", label: "Coordination cost" },
  ];
  for (const { line, field, label } of pairs) {
    const legacy = (details?.[field] as number | null | undefined) ?? null;
    const canonical = costLine(line)?.amount ?? null;
    if (legacy !== null && canonical !== null && Math.abs(legacy - canonical) > 0.001) {
      add("error", String(field), `${label} is ${money(legacy)} in the venue details but ${money(canonical)} on the "${line}" cost line.`);
    } else if ((legacy === null) !== (canonical === null)) {
      add("warning", String(field), `${label} is recorded in only one place (${legacy === null ? "cost line" : "venue details"}).`);
    }
  }

  // 3. VAT: "not stated" must not look like "excluded", and the two copies must agree.
  if (details && details.rentalFeeSaturday !== null) {
    const expected = details.feeIncludesVat === null ? "unknown" : details.feeIncludesVat ? "included" : "excluded";
    const recorded = costLine("venue_hire")?.vat;
    if (recorded && recorded !== expected) {
      add("error", "feeIncludesVat", `VAT on the hire fee is "${expected}" in the venue details but "${recorded}" on the cost line.`);
    }
    if (details.feeIncludesVat !== null && /VAT[^.\n]{0,60}(unconfirmed|not confirmed|unknown|to confirm)/i.test(freeText)) {
      add("warning", "feeIncludesVat", "The notes say VAT is unconfirmed, but the VAT flag on the hire fee is set.");
    }
  }

  // 4. Categorical facts stored in two places must not contradict each other.
  if (details) {
    const accommodation = serviceStatus("accommodation");
    if (details.onsiteAccommodation === true && accommodation === "not_provided") {
      add("error", "onsiteAccommodation", 'Rooms on site is "yes" but the accommodation service is "not provided".');
    }
    if (details.onsiteAccommodation === false && (accommodation === "included" || accommodation === "additional")) {
      add("error", "onsiteAccommodation", 'Rooms on site is "no" but the accommodation service is available.');
    }

    const setup = serviceStatus("setup");
    const breakdown = serviceStatus("breakdown");
    if (details.setupTeardownIncluded !== true && (setup === "included" || breakdown === "included")) {
      add("warning", "setupTeardownIncluded", "The services checklist says setup/breakdown is included, but the venue details field is not set to yes.");
    }
    if (details.setupTeardownIncluded === true && (setup === "not_provided" || breakdown === "not_provided")) {
      add("error", "setupTeardownIncluded", 'Setup & teardown is "included" in the venue details but "not provided" in the services checklist.');
    }

    const catering = serviceStatus("catering");
    if (details.cateringType === "in_house" && catering === "not_provided") {
      add("error", "cateringType", 'Catering is "in house" in the venue details but "not provided" in the services checklist.');
    }
    if ((details.cateringType === "approved_list" || details.cateringType === "external_allowed") && catering === "included") {
      add("error", "cateringType", 'Catering comes from outside the venue in the venue details but "included" in the services checklist.');
    }

    if ((details.barHoursIncluded ?? 0) > 0 && (serviceStatus("open_bar") === "not_provided" || serviceStatus("open_bar") === "additional")) {
      add("warning", "barHoursIncluded", "Bar hours are included in the venue details, but the open bar service is not marked included.");
    }
  }

  return findings;
}
