import "server-only";
import type { WeddingDecision } from "./types";

let decisions: WeddingDecision[] = [
  {
    id: "mock-decision-1",
    title: "Going with a live band over a DJ",
    description: "Booked a 5-piece band for the reception — better energy for an outdoor venue.",
    link: null,
    decidedDate: "2026-03-01",
    orderIndex: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function mockListWeddingDecisions(): WeddingDecision[] {
  return [...decisions].sort((a, b) => a.orderIndex - b.orderIndex || a.title.localeCompare(b.title));
}

export function mockInsertWeddingDecision(data: {
  title: string;
  description: string | null;
  link: string | null;
  decidedDate: string | null;
  orderIndex: number;
}): WeddingDecision {
  const now = new Date().toISOString();
  const decision: WeddingDecision = {
    id: crypto.randomUUID(),
    title: data.title,
    description: data.description,
    link: data.link,
    decidedDate: data.decidedDate,
    orderIndex: data.orderIndex,
    createdAt: now,
    updatedAt: now,
  };
  decisions.push(decision);
  return decision;
}

export function mockDeleteWeddingDecision(id: string): boolean {
  const before = decisions.length;
  decisions = decisions.filter((decision) => decision.id !== id);
  return decisions.length < before;
}

export function mockUpdateWeddingDecision(
  id: string,
  data: { title: string; description: string | null; link: string | null; decidedDate: string | null },
): WeddingDecision | null {
  const index = decisions.findIndex((decision) => decision.id === id);
  if (index === -1) return null;

  const updated: WeddingDecision = {
    ...decisions[index],
    title: data.title,
    description: data.description,
    link: data.link,
    decidedDate: data.decidedDate,
    updatedAt: new Date().toISOString(),
  };
  decisions[index] = updated;
  return updated;
}
