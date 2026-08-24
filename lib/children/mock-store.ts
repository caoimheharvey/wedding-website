import "server-only";
import type { GuestChild } from "./types";

/**
 * In-memory children store used only when LOCAL_TEST_BYPASS_AUTH is set.
 * Resets on every dev server restart — intentional, no persistence needed.
 */
let children: GuestChild[] = [];

export function mockListChildren(): GuestChild[] {
  return [...children];
}

export function mockListChildrenForGuest(guestId: string): GuestChild[] {
  return children.filter((child) => child.guestId === guestId);
}

export function mockInsertChild(data: {
  guestId: string;
  firstName: string;
  lastName: string | null;
}): GuestChild {
  const now = new Date().toISOString();
  const child: GuestChild = { id: crypto.randomUUID(), createdAt: now, updatedAt: now, ...data };
  children.push(child);
  return child;
}

export function mockDeleteChild(id: string): void {
  children = children.filter((child) => child.id !== id);
}
