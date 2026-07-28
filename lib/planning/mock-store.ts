import "server-only";
import type { PlanningChecklistItem, PlanningPhaseId } from "./types";

const SEED_ITEMS: Array<{
  phaseId: PlanningPhaseId;
  title: string;
  description: string;
  orderIndex: number;
}> = [
  {
    phaseId: "vision",
    title: "Discuss wedding vision and priorities",
    description: "Align on the feel, size, and must-haves for your day.",
    orderIndex: 1,
  },
  {
    phaseId: "vision",
    title: "Set your total wedding budget",
    description: "Decide how much you want to spend and what family may contribute.",
    orderIndex: 2,
  },
  {
    phaseId: "vision",
    title: "Start a preliminary guest list",
    description: "Draft names so you can plan capacity and budget realistically.",
    orderIndex: 3,
  },
  {
    phaseId: "vision",
    title: "Research destinations and season",
    description: "Compare locations, weather, and travel for guests.",
    orderIndex: 4,
  },
  {
    phaseId: "big_decisions",
    title: "Choose and confirm your wedding date",
    description: "Lock in the date that works for you and key guests.",
    orderIndex: 1,
  },
  {
    phaseId: "big_decisions",
    title: "Select destination or venue",
    description: "Compare options and pick where you will celebrate.",
    orderIndex: 2,
  },
  {
    phaseId: "big_decisions",
    title: "Book venue or secure a date hold",
    description: "Put down a deposit or hold so the date is yours.",
    orderIndex: 3,
  },
  {
    phaseId: "big_decisions",
    title: "Begin researching key vendors",
    description: "Start shortlists for photographer, caterer, and planner.",
    orderIndex: 4,
  },
  {
    phaseId: "core_vendors",
    title: "Book photographer and videographer",
    description: "Popular vendors book 12–18 months out.",
    orderIndex: 1,
  },
  {
    phaseId: "core_vendors",
    title: "Book caterer and schedule a tasting",
    description: "Confirm menu style and dietary options early.",
    orderIndex: 2,
  },
  {
    phaseId: "core_vendors",
    title: "Book music, band, or DJ",
    description: "Secure entertainment for ceremony and reception.",
    orderIndex: 3,
  },
  {
    phaseId: "core_vendors",
    title: "Book florist",
    description: "Share inspiration and confirm seasonal availability.",
    orderIndex: 4,
  },
  {
    phaseId: "core_vendors",
    title: "Book hair and makeup",
    description: "Trial appointments help finalize your look.",
    orderIndex: 5,
  },
  {
    phaseId: "core_vendors",
    title: "Reserve guest accommodation blocks",
    description: "Hold rooms at a preferred hotel or nearby options.",
    orderIndex: 6,
  },
  {
    phaseId: "guest_comms",
    title: "Finalize guest list",
    description: "Confirm who is invited before save-the-dates go out.",
    orderIndex: 1,
  },
  {
    phaseId: "guest_comms",
    title: "Send save-the-dates",
    description: "Give guests time to plan travel and time off.",
    orderIndex: 2,
  },
  {
    phaseId: "guest_comms",
    title: "Order wedding attire",
    description: "Allow time for fittings and alterations.",
    orderIndex: 3,
  },
  {
    phaseId: "guest_comms",
    title: "Choose wedding party",
    description: "Ask attendants and confirm roles.",
    orderIndex: 4,
  },
  {
    phaseId: "guest_comms",
    title: "Start honeymoon planning",
    description: "Book flights and stays if travelling soon after.",
    orderIndex: 5,
  },
  {
    phaseId: "details",
    title: "Send formal invitations",
    description: "Include RSVP deadline, dress code, and website link.",
    orderIndex: 1,
  },
  {
    phaseId: "details",
    title: "Track RSVPs and meal choices",
    description: "Follow up with guests who have not responded.",
    orderIndex: 2,
  },
  {
    phaseId: "details",
    title: "Plan ceremony and reception timeline",
    description: "Walk through the day with your venue or planner.",
    orderIndex: 3,
  },
  {
    phaseId: "details",
    title: "Order cake and stationery details",
    description: "Confirm flavours, signage, and place cards.",
    orderIndex: 4,
  },
  {
    phaseId: "details",
    title: "Arrange wedding-day transport",
    description: "Book cars or shuttles for the wedding party and guests.",
    orderIndex: 5,
  },
  {
    phaseId: "final_prep",
    title: "Confirm final headcount with vendors",
    description: "Share numbers for catering, seating, and favours.",
    orderIndex: 1,
  },
  {
    phaseId: "final_prep",
    title: "Create seating chart",
    description: "Assign tables for confirmed guests.",
    orderIndex: 2,
  },
  {
    phaseId: "final_prep",
    title: "Final walkthrough with venue",
    description: "Confirm layout, timing, and vendor access.",
    orderIndex: 3,
  },
  {
    phaseId: "final_prep",
    title: "Pack wedding-day emergency kit",
    description: "Safety pins, tape, pain relief, snacks, and touch-up makeup.",
    orderIndex: 4,
  },
  {
    phaseId: "final_prep",
    title: "Plan rehearsal dinner",
    description: "Confirm who attends and where it is held.",
    orderIndex: 5,
  },
];

let items: PlanningChecklistItem[] = SEED_ITEMS.map((seed, index) => ({
  id: `mock-checklist-${index + 1}`,
  phaseId: seed.phaseId,
  title: seed.title,
  description: seed.description,
  orderIndex: seed.orderIndex,
  isComplete: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));

export function mockListChecklistItems(): PlanningChecklistItem[] {
  return items;
}

export function mockSetChecklistItemComplete(
  itemId: string,
  isComplete: boolean,
): PlanningChecklistItem | null {
  const index = items.findIndex((item) => item.id === itemId);
  if (index === -1) return null;

  items[index] = {
    ...items[index],
    isComplete,
    updatedAt: new Date().toISOString(),
  };
  return items[index];
}

export function mockInsertChecklistItem(data: {
  phaseId: PlanningPhaseId;
  title: string;
  description: string | null;
}): PlanningChecklistItem {
  const phaseItems = items.filter((item) => item.phaseId === data.phaseId);
  const orderIndex =
    phaseItems.length > 0 ? Math.max(...phaseItems.map((item) => item.orderIndex)) + 1 : 1;
  const now = new Date().toISOString();
  const item: PlanningChecklistItem = {
    id: crypto.randomUUID(),
    phaseId: data.phaseId,
    title: data.title,
    description: data.description,
    orderIndex,
    isComplete: false,
    createdAt: now,
    updatedAt: now,
  };
  items.push(item);
  return item;
}
