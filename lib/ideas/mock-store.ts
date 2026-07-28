import "server-only";
import type { WeddingIdea } from "./types";

let ideas: WeddingIdea[] = [
  {
    id: "mock-idea-1",
    title: "Guest bingo at each table",
    description: "Icebreaker cards with fun facts about the couple — guests mark off squares as they mingle.",
    orderIndex: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function mockListWeddingIdeas(): WeddingIdea[] {
  return [...ideas].sort((a, b) => a.orderIndex - b.orderIndex || a.title.localeCompare(b.title));
}

export function mockInsertWeddingIdea(data: {
  title: string;
  description: string | null;
  orderIndex: number;
}): WeddingIdea {
  const now = new Date().toISOString();
  const idea: WeddingIdea = {
    id: crypto.randomUUID(),
    title: data.title,
    description: data.description,
    orderIndex: data.orderIndex,
    createdAt: now,
    updatedAt: now,
  };
  ideas.push(idea);
  return idea;
}

export function mockDeleteWeddingIdea(id: string): boolean {
  const before = ideas.length;
  ideas = ideas.filter((idea) => idea.id !== id);
  return ideas.length < before;
}
