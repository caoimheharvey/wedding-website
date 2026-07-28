import "server-only";
import type * as z from "zod";
import type { Vendor } from "./types";
import type { bookingStatusFormSchema, vendorFormSchema } from "./schema";
import { parseOptionalAmount } from "./schema";

/**
 * In-memory vendors used only when LOCAL_TEST_BYPASS_AUTH is set. Resets on
 * every dev server restart — intentional, no persistence needed.
 */
let vendors: Vendor[] = seed();

function makeVendor(overrides: Partial<Vendor> & Pick<Vendor, "category" | "name">): Vendor {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    contactName: null,
    email: null,
    phone: null,
    website: null,
    priceQuote: null,
    notes: null,
    isSelected: false,
    depositPaid: false,
    depositAmount: null,
    depositDate: null,
    fullyPaid: false,
    fullyPaidAmount: null,
    fullyPaidDate: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function seed(): Vendor[] {
  return [
    makeVendor({
      category: "flowers_decor",
      name: "Amalfi Bloom Studio",
      contactName: "Giulia Russo",
      email: "giulia@amalfibloom.example",
      phone: "+39 089 123 4567",
      website: "https://amalfibloom.example",
      priceQuote: 2400,
      notes: "Loved the mood board they sent — very Mediterranean, lots of olive branches.",
      isSelected: true,
      depositPaid: true,
      depositAmount: 500,
      depositDate: "2026-03-01",
    }),
    makeVendor({
      category: "flowers_decor",
      name: "Petali & Co.",
      contactName: "Marco Esposito",
      email: "marco@petali.example",
      priceQuote: 2900,
      notes: "Pricier, but does the venue's flowers regularly so setup is easier for them.",
    }),
    makeVendor({
      category: "photography",
      name: "Sorrento Light Photography",
      contactName: "Anna De Luca",
      email: "anna@sorrentolight.example",
      website: "https://sorrentolight.example",
      priceQuote: 3200,
      notes: "Portfolio has a lot of coastal weddings, great golden-hour shots.",
      isSelected: true,
      depositPaid: true,
      depositAmount: 800,
      depositDate: "2026-02-15",
      fullyPaid: false,
    }),
    makeVendor({
      category: "photography",
      name: "Studio Vico",
      priceQuote: 2750,
      notes: "Cheaper, but only one sample gallery to review.",
    }),
    makeVendor({
      category: "catering",
      name: "Trattoria del Golfo — Catering",
      contactName: "Roberto Fiore",
      phone: "+39 081 555 0199",
      priceQuote: 8500,
      notes: "Tasting scheduled for next visit. Family-run, does a lot of weddings at the venue.",
    }),
    makeVendor({
      category: "venue",
      name: "Villa Cimbrone",
      email: "events@villacimbrone.example",
      website: "https://villacimbrone.example",
      priceQuote: 6000,
      notes: "Booked — this is the ceremony + reception venue.",
      isSelected: true,
      depositPaid: true,
      depositAmount: 2000,
      depositDate: "2025-11-01",
      fullyPaid: true,
      fullyPaidAmount: 6000,
      fullyPaidDate: "2026-05-01",
    }),
  ];
}

export function mockListVendors(): Vendor[] {
  return [...vendors].sort((a, b) => a.name.localeCompare(b.name));
}

export function mockGetVendorById(id: string): Vendor | null {
  return vendors.find((vendor) => vendor.id === id) ?? null;
}

export function mockInsertVendor(data: z.infer<typeof vendorFormSchema>): Vendor {
  const vendor = makeVendor({
    category: data.category,
    name: data.name,
    contactName: data.contactName || null,
    email: data.email || null,
    phone: data.phone || null,
    website: data.website || null,
    priceQuote: parseOptionalAmount(data.priceQuote),
    notes: data.notes || null,
  });
  vendors.push(vendor);
  return vendor;
}

export function mockUpdateVendor(id: string, data: z.infer<typeof vendorFormSchema>): void {
  vendors = vendors.map((vendor) =>
    vendor.id === id
      ? {
          ...vendor,
          category: data.category,
          name: data.name,
          contactName: data.contactName || null,
          email: data.email || null,
          phone: data.phone || null,
          website: data.website || null,
          priceQuote: parseOptionalAmount(data.priceQuote),
          notes: data.notes || null,
          updatedAt: new Date().toISOString(),
        }
      : vendor,
  );
}

export function mockDeleteVendor(id: string): void {
  vendors = vendors.filter((vendor) => vendor.id !== id);
}

/** Selecting a vendor clears the flag on every other vendor in that category. */
export function mockSetVendorSelected(id: string, selected: boolean): void {
  const target = vendors.find((vendor) => vendor.id === id);
  if (!target) return;

  vendors = vendors.map((vendor) => {
    if (vendor.id === id) return { ...vendor, isSelected: selected, updatedAt: new Date().toISOString() };
    if (selected && vendor.category === target.category) {
      return vendor.isSelected ? { ...vendor, isSelected: false, updatedAt: new Date().toISOString() } : vendor;
    }
    return vendor;
  });
}

export function mockUpdateBookingStatus(
  id: string,
  data: z.infer<typeof bookingStatusFormSchema>,
): void {
  vendors = vendors.map((vendor) =>
    vendor.id === id
      ? {
          ...vendor,
          depositPaid: data.depositPaid,
          depositAmount: parseOptionalAmount(data.depositAmount),
          depositDate: data.depositDate || null,
          fullyPaid: data.fullyPaid,
          fullyPaidAmount: parseOptionalAmount(data.fullyPaidAmount),
          fullyPaidDate: data.fullyPaidDate || null,
          updatedAt: new Date().toISOString(),
        }
      : vendor,
  );
}
