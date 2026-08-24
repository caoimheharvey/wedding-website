import type { Guest } from "./types";

export const PLUS_ONE_SUCCESS_MESSAGE = "Thanks — we've added your plus-one!";

/** Whether `guest` has been granted a plus-one but hasn't added their details yet. */
export function guestNeedsPlusOneForm(
  guest: Pick<Guest, "id" | "plusOneAllowed">,
  allGuests: Pick<Guest, "isPlusOneOf">[],
): boolean {
  if (!guest.plusOneAllowed) return false;
  return !allGuests.some((other) => other.isPlusOneOf === guest.id);
}
