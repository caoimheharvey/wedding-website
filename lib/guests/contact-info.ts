import type { PreferredLanguage } from "./types";

export const CONTACT_INFO_SUCCESS_MESSAGE = "Thanks — we've saved your details!";

export function guestNeedsContactOnboarding(guest: {
  email: string | null;
  phone: string | null;
}): boolean {
  return !guest.email?.trim() && !guest.phone?.trim();
}

export function guestNeedsLastName(guest: { lastName: string | null }): boolean {
  return !guest.lastName?.trim();
}

export function guestNeedsFirstName(guest: { firstName: string | null }): boolean {
  return !guest.firstName?.trim();
}

/** Whether a guest has enough contact info on file to show read-only rather than as an open form. */
export function guestContactIsComplete(guest: {
  firstName: string | null;
  email: string | null;
  phone: string | null;
}): boolean {
  return !guestNeedsFirstName(guest) && !guestNeedsContactOnboarding(guest);
}

/**
 * Whether it's fine to leave this guest's contact info blank for now — true
 * for plus-ones once we at least have their name. We don't need a plus-one's
 * phone or email up front; the guest who added them can fill it in later if
 * they want to.
 */
export function guestContactCanBeSkipped(guest: {
  isPlusOneOf: string | null;
  firstName: string | null;
}): boolean {
  return Boolean(guest.isPlusOneOf) && !guestNeedsFirstName(guest);
}

export interface ContactInfoEntry {
  guestId: string;
  firstName: string;
  lastName: string;
  preferredLanguage: PreferredLanguage;
  email: string;
  phoneCountryId: string;
  phoneNational: string;
}
