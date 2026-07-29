import "server-only";
import type * as z from "zod";
import type { Destination, DestinationRequirement } from "./types";
import { parseOptionalAmount, type destinationFormSchema, type outreachFormSchema } from "./schema";

/**
 * In-memory destinations used only when LOCAL_TEST_BYPASS_AUTH is set.
 * Resets on every dev server restart — intentional, no persistence needed.
 */
let destinations: Destination[] = seed();

function makeDestination(overrides: Partial<Destination> & Pick<Destination, "name">): Destination {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    location: null,
    description: null,
    estimatedCost: null,
    costRationale: null,
    travelNotes: null,
    guestCapacityNotes: null,
    pros: null,
    cons: null,
    notes: null,
    isSelected: false,
    isShortlisted: false,
    outreachContacted: false,
    outreachContactedDate: null,
    outreachQuotesReceived: false,
    outreachNotes: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function seed(): Destination[] {
  return [
    makeDestination({
      name: "Amalfi Coast",
      location: "Italy",
      description: "Villa Cimbrone-style clifftop venues with sea views; where we got engaged.",
      estimatedCost: 35000,
      travelNotes: "Direct flights to Naples from most of Europe, then ~1.5hr transfer.",
      guestCapacityNotes: "Most villas cap out around 100-120 guests.",
      pros: "Sentimental, stunning views, lots of venue options nearby.",
      cons: "Peak season pricing, narrow coastal roads can be slow for guest transport.",
      isSelected: true,
    }),
    makeDestination({
      name: "Algarve",
      location: "Portugal",
      description: "Coastal clifftop venues, generally more budget-friendly than Italy.",
      estimatedCost: 26000,
      travelNotes: "Direct flights to Faro from most of Europe, short transfers.",
      guestCapacityNotes: "Wide range of venue sizes, up to 150+ guests.",
      pros: "Lower cost, easier logistics, great weather odds.",
      cons: "Less personal significance for us than the Amalfi Coast.",
    }),
    makeDestination({
      name: "Provence",
      location: "France",
      description: "Lavender-field chateaux and countryside estates.",
      estimatedCost: 32000,
      travelNotes: "Fly into Marseille or Nice, ~1hr transfer depending on venue.",
      guestCapacityNotes: "Chateaux typically 80-100 guests.",
      pros: "Beautiful scenery, strong food & wine reputation.",
      cons: "Lavender season (peak beauty) is also peak wedding season pricing.",
      notes: "Worth a shortlist visit if Amalfi venues fall through.",
    }),
  ];
}

export function mockListDestinations(): Destination[] {
  return [...destinations].sort((a, b) => a.name.localeCompare(b.name));
}

export function mockGetDestinationById(id: string): Destination | null {
  return destinations.find((destination) => destination.id === id) ?? null;
}

export function mockInsertDestination(data: z.infer<typeof destinationFormSchema>): Destination {
  const destination = makeDestination({
    name: data.name,
    location: data.location || null,
    description: data.description || null,
    estimatedCost: parseOptionalAmount(data.estimatedCost),
    costRationale: data.costRationale || null,
    travelNotes: data.travelNotes || null,
    guestCapacityNotes: data.guestCapacityNotes || null,
    pros: data.pros || null,
    cons: data.cons || null,
    notes: data.notes || null,
  });
  destinations.push(destination);
  return destination;
}

export function mockUpdateDestination(id: string, data: z.infer<typeof destinationFormSchema>): void {
  destinations = destinations.map((destination) =>
    destination.id === id
      ? {
          ...destination,
          name: data.name,
          location: data.location || null,
          description: data.description || null,
          estimatedCost: parseOptionalAmount(data.estimatedCost),
          costRationale: data.costRationale || null,
          travelNotes: data.travelNotes || null,
          guestCapacityNotes: data.guestCapacityNotes || null,
          pros: data.pros || null,
          cons: data.cons || null,
          notes: data.notes || null,
          updatedAt: new Date().toISOString(),
        }
      : destination,
  );
}

export function mockDeleteDestination(id: string): void {
  destinations = destinations.filter((destination) => destination.id !== id);
}

/** Selecting a destination clears the flag on every other destination. */
export function mockSetDestinationSelected(id: string, selected: boolean): void {
  destinations = destinations.map((destination) => {
    if (destination.id === id) {
      return { ...destination, isSelected: selected, updatedAt: new Date().toISOString() };
    }
    if (selected && destination.isSelected) {
      return { ...destination, isSelected: false, updatedAt: new Date().toISOString() };
    }
    return destination;
  });
}

/** Shortlisting is not exclusive — unlike isSelected, multiple can be true. */
export function mockSetDestinationShortlisted(id: string, shortlisted: boolean): void {
  destinations = destinations.map((destination) =>
    destination.id === id
      ? { ...destination, isShortlisted: shortlisted, updatedAt: new Date().toISOString() }
      : destination,
  );
}

export function mockUpdateDestinationOutreach(
  id: string,
  data: z.infer<typeof outreachFormSchema>,
): void {
  destinations = destinations.map((destination) =>
    destination.id === id
      ? {
          ...destination,
          outreachContacted: data.contacted,
          outreachContactedDate: data.contactedDate || null,
          outreachQuotesReceived: data.quotesReceived,
          outreachNotes: data.notes || null,
          updatedAt: new Date().toISOString(),
        }
      : destination,
  );
}

let destinationRequirements: DestinationRequirement[] = [];

export function mockListDestinationRequirements(): DestinationRequirement[] {
  return [...destinationRequirements].sort((a, b) => a.orderIndex - b.orderIndex);
}

export function mockInsertDestinationRequirement(requirement: string): DestinationRequirement {
  const now = new Date().toISOString();
  const item: DestinationRequirement = {
    id: crypto.randomUUID(),
    requirement,
    orderIndex: destinationRequirements.length + 1,
    createdAt: now,
    updatedAt: now,
  };
  destinationRequirements.push(item);
  return item;
}

export function mockDeleteDestinationRequirement(id: string): boolean {
  const before = destinationRequirements.length;
  destinationRequirements = destinationRequirements.filter((item) => item.id !== id);
  return destinationRequirements.length < before;
}
