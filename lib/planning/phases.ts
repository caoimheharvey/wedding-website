import type { PlanningPhase, PlanningPhaseId } from "./types";

/** Ordered from earliest (furthest out) to latest. */
export const PLANNING_PHASES: PlanningPhase[] = [
  {
    id: "vision",
    label: "Vision & foundations",
    description: "Set your direction, budget, and early guest list — about 2 years out.",
    minMonthsBefore: 24,
  },
  {
    id: "big_decisions",
    label: "Big decisions",
    description: "Lock in your date, destination, and venue — 18–24 months out.",
    minMonthsBefore: 18,
  },
  {
    id: "core_vendors",
    label: "Core vendors",
    description: "Book the vendors that fill up fast — 12–18 months out.",
    minMonthsBefore: 12,
  },
  {
    id: "guest_comms",
    label: "Guests & attire",
    description: "Save-the-dates, attire, and wedding party — 9–12 months out.",
    minMonthsBefore: 9,
  },
  {
    id: "details",
    label: "Invitations & details",
    description: "Invitations, RSVPs, and day-of logistics — 6–9 months out.",
    minMonthsBefore: 6,
  },
  {
    id: "final_prep",
    label: "Final countdown",
    description: "Headcount, seating, and last walkthroughs — under 6 months.",
    minMonthsBefore: 0,
  },
];

export function getPlanningPhaseById(id: PlanningPhaseId): PlanningPhase {
  const phase = PLANNING_PHASES.find((entry) => entry.id === id);
  if (!phase) throw new Error(`Unknown planning phase: ${id}`);
  return phase;
}

/** Months until wedding from today (can be fractional). */
export function monthsUntilWedding(weddingDateIso: string, today = new Date()): number {
  const wedding = parseIsoDate(weddingDateIso);
  const start = startOfDay(today);
  const diffMs = wedding.getTime() - start.getTime();
  return diffMs / (1000 * 60 * 60 * 24 * 30.4375);
}

export function getCurrentPlanningPhase(
  weddingDateIso: string | null,
  today = new Date(),
): PlanningPhase | null {
  if (!weddingDateIso) return null;

  const months = monthsUntilWedding(weddingDateIso, today);
  if (months < 0) return PLANNING_PHASES[PLANNING_PHASES.length - 1];

  for (const phase of PLANNING_PHASES) {
    if (months >= phase.minMonthsBefore) return phase;
  }

  return PLANNING_PHASES[PLANNING_PHASES.length - 1];
}

function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
