"use server";

import { redirect } from "next/navigation";
import { listGuests } from "@/lib/guests/queries";
import { resolveGuestForQuickSignIn } from "@/lib/guests/guest-lookup";
import { createGuestSession, deleteGuestSession } from "./session";

const QUICK_SIGN_IN_SESSION_MS = 12 * 60 * 60 * 1000; // 12 hours

// Deliberately vague — don't confirm whether the name or the contact detail
// was the part that didn't match.
const QUICK_SIGN_IN_ERROR =
  "We couldn't find a match for those details. Double-check your first and last name, or ask whoever sent your invitation.";

const CONTACT_REQUIRED_ERROR =
  "Enter the email or phone number we have on file for you.";

export type QuickSignInState = { message?: string } | undefined;

/**
 * Sign-in for guests — matches first and last name (case-insensitive). When we
 * already have an email or phone on file, that detail must match too. Guests
 * with no contact info on file can sign in by name alone and are prompted to
 * add details before viewing the rest of the site.
 */
export async function quickGuestSignIn(
  _prevState: QuickSignInState,
  formData: FormData,
): Promise<QuickSignInState> {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const contact = String(formData.get("contact") ?? "").trim();

  if (!firstName || !lastName) {
    return { message: "Enter your first and last name as shown on your invitation." };
  }

  const guests = await listGuests();
  const result = resolveGuestForQuickSignIn(guests, firstName, lastName, contact);

  if (result === "contact_required") return { message: CONTACT_REQUIRED_ERROR };
  if (result === "contact_mismatch" || result === null) return { message: QUICK_SIGN_IN_ERROR };

  await createGuestSession(result.id, QUICK_SIGN_IN_SESSION_MS);
  redirect("/");
}

export async function signOutGuest(): Promise<void> {
  await deleteGuestSession();
  redirect("/");
}
