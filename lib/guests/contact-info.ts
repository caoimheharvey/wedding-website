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

export interface ContactInfoEntry {
  guestId: string;
  lastName: string;
  email: string;
  phoneCountryId: string;
  phoneNational: string;
}
