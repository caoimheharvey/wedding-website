import "server-only";
import * as z from "zod";
import {
  addBudgetItem,
  addContribution,
  patchBudgetItem,
  patchContribution,
  setTotalBudget,
} from "@/lib/budget/service";
import { getBudgetSummary, listBudgetItems, listContributions } from "@/lib/budget/queries";
import { getGuestById, listGuests } from "@/lib/guests/queries";
import { RSVP_STATUS_OPTIONS, INVITED_BY_OPTIONS } from "@/lib/guests/types";
import type { Guest } from "@/lib/guests/types";
import { listCategories } from "@/lib/categories/queries";
import { listChecklistItems } from "@/lib/planning/queries";
import { addChecklistItem, patchChecklistItem } from "@/lib/planning/service";
import { PLANNING_PHASES } from "@/lib/planning/phases";
import type { PlanningPhaseId } from "@/lib/planning/types";
import { getVendorById, listVendors } from "@/lib/vendors/queries";
import {
  createVendorRecord,
  patchBookingStatus,
  patchVendorRecord,
  selectVendor,
} from "@/lib/vendors/service";
import { getVenueDetails, listVenueUpdates } from "@/lib/venues/queries";
import { patchVenueDetails } from "@/lib/venues/service";
import { CATERING_TYPES, COORDINATION_TYPES, OUTREACH_STATUSES, UPDATE_KINDS } from "@/lib/venues/types";

interface McpTool<Schema extends z.ZodType = z.ZodType> {
  name: string;
  description: string;
  input: Schema;
  run: (input: z.infer<Schema>) => Promise<unknown>;
}

function tool<Schema extends z.ZodType>(definition: McpTool<Schema>): McpTool {
  return definition as unknown as McpTool;
}

const phaseIds = PLANNING_PHASES.map((phase) => phase.id) as [PlanningPhaseId, ...PlanningPhaseId[]];
const nullableText = z.string().nullable().optional();
const nullableAmount = z.number().min(0).nullable().optional();
const isoDate = z.iso.date();
const today = () => new Date().toISOString().slice(0, 10);

const vendorFields = {
  name: z.string().min(1).optional().describe("Vendor name"),
  contactName: nullableText,
  email: z.string().nullable().optional().describe("Contact email, or null to clear"),
  phone: nullableText,
  website: z.string().nullable().optional().describe("Full URL including https://, or null to clear"),
  priceQuote: nullableAmount.describe("Quoted price in the budget currency, or null for no quote yet"),
  notes: nullableText,
};

// Venue answers use real JSON types; null clears a field ("not stated").
const venueFields = z.object({
  outreachStatus: z.enum(OUTREACH_STATUSES),
  availableDates: nullableText,
  exclusiveHire: z.boolean().nullable(),
  maxCapacity: z.number().int().min(0).nullable(),
  hireHours: nullableText,
  rentalFeeSaturday: nullableAmount,
  feeIncludesVat: z.boolean().describe("false means vatPercent is added on top of the fee"),
  vatPercent: z.number().min(0),
  pricePerPerson: nullableAmount,
  minSpend: nullableAmount,
  minGuests: z.number().int().min(0).nullable(),
  otherCosts: nullableText,
  estimateNotes: nullableText,
  barHoursIncluded: nullableAmount,
  extraBarHourCost: nullableAmount,
  musicCurfew: nullableText,
  ceremonyOnSite: z.boolean().nullable(),
  setupTeardownIncluded: z.boolean().nullable(),
  cateringType: z.enum(CATERING_TYPES).nullable(),
  coordination: z.enum(COORDINATION_TYPES).nullable(),
  coordinationCost: nullableAmount,
  onsiteAccommodation: z.boolean().nullable(),
  accommodationNotes: nullableText,
  depositAmount: nullableAmount,
  paymentSchedule: nullableText,
  cancellationPolicy: nullableText,
});

/** Drop `undefined` so a patch only carries the fields that were actually sent. */
function defined<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as {
    [K in keyof T]?: Exclude<T[K], undefined>;
  };
}

export const MCP_TOOLS: McpTool[] = [
  tool({
    name: "list_vendor_categories",
    description: "List vendor categories (ids to use when creating vendors).",
    input: z.object({}),
    run: async () => listCategories(),
  }),
  tool({
    name: "list_vendors",
    description: "List vendors, optionally for one category. Includes price quote, selection and booking status.",
    input: z.object({ category: z.string().optional().describe("Category id, e.g. venue") }),
    run: async ({ category }) => {
      const vendors = await listVendors();
      return category ? vendors.filter((vendor) => vendor.category === category) : vendors;
    },
  }),
  tool({
    name: "get_vendor",
    description: "Get one vendor. For venues this also returns the reply details and the update history.",
    input: z.object({ vendorId: z.uuid() }),
    run: async ({ vendorId }) => {
      const vendor = await getVendorById(vendorId);
      if (!vendor) throw new Error("Vendor not found.");
      if (vendor.category !== "venue") return { vendor };
      const [venueDetails, history] = await Promise.all([getVenueDetails(vendorId), listVenueUpdates(vendorId)]);
      return { vendor, venueDetails, history };
    },
  }),
  tool({
    name: "create_vendor",
    description: "Add a vendor. Use list_vendor_categories for valid category ids.",
    input: z.object({
      category: z.string().min(1),
      ...vendorFields,
      name: z.string().min(1).describe("Vendor name"),
    }),
    run: async (input) => createVendorRecord(defined(input) as Parameters<typeof createVendorRecord>[0]),
  }),
  tool({
    name: "update_vendor",
    description: "Update a vendor's details. Only the fields you send change; send null to clear one.",
    input: z.object({ vendorId: z.uuid(), category: z.string().optional(), ...vendorFields }),
    run: async ({ vendorId, ...patch }) => patchVendorRecord(vendorId, defined(patch)),
  }),
  tool({
    name: "set_vendor_selected",
    description: "Mark a vendor as the chosen one for its category (clears the flag on the others), or unmark it.",
    input: z.object({ vendorId: z.uuid(), selected: z.boolean() }),
    run: async ({ vendorId, selected }) => selectVendor(vendorId, selected),
  }),
  tool({
    name: "update_booking_status",
    description: "Record deposit / full payment for a vendor. Only the fields you send change.",
    input: z.object({
      vendorId: z.uuid(),
      depositPaid: z.boolean().optional(),
      depositAmount: nullableAmount,
      depositDate: isoDate.nullable().optional(),
      fullyPaid: z.boolean().optional(),
      fullyPaidAmount: nullableAmount,
      fullyPaidDate: isoDate.nullable().optional(),
    }),
    run: async ({ vendorId, ...patch }) => patchBookingStatus(vendorId, defined(patch)),
  }),
  tool({
    name: "update_venue_details",
    description:
      "Update a venue's reply details (price, dates, terms, catering, etc.). Only the fields in `fields` change; null means not stated. A history entry is logged, optionally with the original text of the reply.",
    input: z.object({
      vendorId: z.uuid(),
      fields: venueFields.partial(),
      updateKind: z.enum(UPDATE_KINDS).default("note"),
      updateDate: isoDate.optional().describe("Date of the reply/visit/call; defaults to today"),
      sourceText: z.string().optional().describe("Original reply or note text to keep in the history"),
    }),
    run: async ({ vendorId, fields, updateKind, updateDate, sourceText }) => {
      const vendor = await getVendorById(vendorId);
      if (!vendor) throw new Error("Vendor not found.");
      if (vendor.category !== "venue") throw new Error("Venue details only apply to vendors in the venue category.");
      return patchVenueDetails(vendorId, defined(fields) as never, {
        kind: updateKind,
        date: updateDate ?? today(),
        text: sourceText,
      });
    },
  }),
  tool({
    name: "list_checklist",
    description: "List the planning to-do checklist grouped by phase, with completion state.",
    input: z.object({
      phaseId: z.enum(phaseIds).optional(),
      status: z.enum(["all", "open", "done"]).default("all"),
    }),
    run: async ({ phaseId, status }) => {
      const items = (await listChecklistItems()).filter(
        (item) =>
          (!phaseId || item.phaseId === phaseId) &&
          (status === "all" || (status === "done") === item.isComplete),
      );
      return PLANNING_PHASES.map((phase) => ({
        phaseId: phase.id,
        label: phase.label,
        items: items
          .filter((item) => item.phaseId === phase.id)
          .map(({ id, title, description, isComplete }) => ({ id, title, description, isComplete })),
      })).filter((phase) => phase.items.length > 0);
    },
  }),
  tool({
    name: "add_checklist_item",
    description: `Add a to-do. phaseId is one of: ${PLANNING_PHASES.map((p) => `${p.id} (${p.label})`).join(", ")}.`,
    input: z.object({ title: z.string().trim().min(1), description: z.string().optional(), phaseId: z.enum(phaseIds) }),
    run: async ({ title, description, phaseId }) =>
      addChecklistItem({ title, description: description?.trim() || null, phaseId }),
  }),
  tool({
    name: "update_checklist_item",
    description: "Edit a to-do: rename it, change its notes or phase, or mark it done / not done.",
    input: z.object({
      itemId: z.string().min(1),
      title: z.string().trim().min(1).optional(),
      description: z.string().nullable().optional(),
      phaseId: z.enum(phaseIds).optional(),
      isComplete: z.boolean().optional(),
    }),
    run: async ({ itemId, ...patch }) => patchChecklistItem(itemId, defined(patch)),
  }),
];

const guestName = (guest: Guest) => [guest.firstName, guest.lastName].filter(Boolean).join(" ") || "(name not given yet)";

const countBy = <T,>(items: T[], key: (item: T) => string) =>
  items.reduce<Record<string, number>>((counts, item) => {
    const k = key(item);
    counts[k] = (counts[k] ?? 0) + 1;
    return counts;
  }, {});

const MORE_TOOLS: McpTool[] = [
  tool({
    name: "get_guest_summary",
    description:
      "Guest list overview: totals and counts by RSVP status, who invited them, language, plus-one status, dietary notes and wedding-party roles.",
    input: z.object({}),
    run: async () => {
      const guests = await listGuests();
      return {
        total: guests.length,
        confirmedAttending: guests.filter((g) => g.rsvpStatus === "yes").length,
        byRsvpStatus: countBy(guests, (g) => g.rsvpStatus),
        byInvitedBy: countBy(guests, (g) => g.invitedBy),
        byLanguage: countBy(guests, (g) => g.preferredLanguage),
        byPriority: countBy(guests, (g) => String(g.relationshipPriority)),
        plusOnes: countBy(
          guests.filter((g) => g.isPlusOneOf),
          (g) => g.plusOneStatus ?? "linked",
        ),
        withDietaryRestrictions: guests.filter((g) => g.dietaryRestrictions).length,
        seated: guests.filter((g) => g.seatingTableId).length,
      };
    },
  }),
  tool({
    name: "list_guests",
    description: "List guests (read-only) with optional filters. Use get_guest for every field of one guest.",
    input: z.object({
      search: z.string().optional().describe("Matches name, email or phone"),
      rsvpStatus: z.enum(RSVP_STATUS_OPTIONS).optional(),
      invitedBy: z.enum(INVITED_BY_OPTIONS).optional(),
      withDietaryRestrictions: z.boolean().optional(),
    }),
    run: async ({ search, rsvpStatus, invitedBy, withDietaryRestrictions }) => {
      const term = search?.trim().toLowerCase();
      return (await listGuests())
        .filter(
          (g) =>
            (!rsvpStatus || g.rsvpStatus === rsvpStatus) &&
            (!invitedBy || g.invitedBy === invitedBy) &&
            (withDietaryRestrictions === undefined || Boolean(g.dietaryRestrictions) === withDietaryRestrictions) &&
            (!term ||
              [guestName(g), g.email, g.phone].some((value) => value?.toLowerCase().includes(term))),
        )
        .map((g) => ({
          id: g.id,
          name: guestName(g),
          email: g.email,
          phone: g.phone,
          rsvpStatus: g.rsvpStatus,
          invitedBy: g.invitedBy,
          relationshipPriority: g.relationshipPriority,
          partyRoles: g.partyRoles,
          isPlusOneOf: g.isPlusOneOf,
          dietaryRestrictions: g.dietaryRestrictions,
        }));
    },
  }),
  tool({
    name: "get_guest",
    description: "Get every field for one guest (read-only).",
    input: z.object({ guestId: z.string().min(1) }),
    run: async ({ guestId }) => {
      const guest = await getGuestById(guestId);
      if (!guest) throw new Error("Guest not found.");
      return guest;
    },
  }),
  tool({
    name: "get_budget_summary",
    description:
      "Budget overview: total budget, family contributions, available budget, budgeted vs actual, and per-category totals.",
    input: z.object({}),
    run: async () => getBudgetSummary(),
  }),
  tool({
    name: "list_budget_items",
    description: "List budget line items, optionally for one category.",
    input: z.object({ category: z.string().optional() }),
    run: async ({ category }) => {
      const items = await listBudgetItems();
      return category ? items.filter((item) => item.category === category) : items;
    },
  }),
  tool({
    name: "add_budget_item",
    description: "Add a budget line item. Use list_vendor_categories for valid category ids.",
    input: z.object({
      name: z.string().min(1),
      category: z.string().min(1),
      budgetedAmount: z.number().min(0).default(0),
      actualAmount: z.number().min(0).default(0),
      isDiy: z.boolean().default(false),
      notes: z.string().nullable().optional(),
    }),
    run: async (input) => addBudgetItem(defined(input) as Parameters<typeof addBudgetItem>[0]),
  }),
  tool({
    name: "update_budget_item",
    description: "Update a budget line item (e.g. record the actual amount spent). Only the fields you send change.",
    input: z.object({
      itemId: z.string().min(1),
      name: z.string().min(1).optional(),
      category: z.string().optional(),
      budgetedAmount: z.number().min(0).optional(),
      actualAmount: z.number().min(0).optional(),
      isDiy: z.boolean().optional(),
      notes: z.string().nullable().optional(),
    }),
    run: async ({ itemId, ...patch }) => patchBudgetItem(itemId, defined(patch)),
  }),
  tool({
    name: "set_total_budget",
    description: "Set the couple's total budget (excludes family contributions), or null to clear it.",
    input: z.object({ amount: z.number().min(0).nullable() }),
    run: async ({ amount }) => {
      await setTotalBudget(amount);
      return getBudgetSummary();
    },
  }),
  tool({
    name: "list_budget_contributions",
    description: "List family contributions toward the budget.",
    input: z.object({}),
    run: async () => listContributions(),
  }),
  tool({
    name: "add_budget_contribution",
    description: "Record a contribution someone has made toward the budget.",
    input: z.object({
      contributorName: z.string().min(1),
      amount: z.number().min(0),
      notes: z.string().nullable().optional(),
    }),
    run: async (input) => addContribution(defined(input) as Parameters<typeof addContribution>[0]),
  }),
  tool({
    name: "update_budget_contribution",
    description: "Update a contribution. Only the fields you send change.",
    input: z.object({
      contributionId: z.string().min(1),
      contributorName: z.string().min(1).optional(),
      amount: z.number().min(0).optional(),
      notes: z.string().nullable().optional(),
    }),
    run: async ({ contributionId, ...patch }) => patchContribution(contributionId, defined(patch)),
  }),
];
MCP_TOOLS.push(...MORE_TOOLS);
