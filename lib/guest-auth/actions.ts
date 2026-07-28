"use server";

import { redirect } from "next/navigation";
import { listGuests } from "@/lib/guests/queries";
import { findGuestByWechatHandle, resolveGuestForQuickSignIn } from "@/lib/guests/guest-lookup";
import { GUEST_SITE_STRINGS } from "@/lib/guest-site/i18n";
import { PREFERRED_LANGUAGE_LABELS, type PreferredLanguage } from "@/lib/guests/types";
import { createGuestSession, deleteGuestSession } from "./session";

const QUICK_SIGN_IN_SESSION_MS = 12 * 60 * 60 * 1000; // 12 hours

function parseLanguage(value: FormDataEntryValue | null): PreferredLanguage {
  const str = String(value ?? "");
  return str in PREFERRED_LANGUAGE_LABELS ? (str as PreferredLanguage) : "en";
}

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
  const strings = GUEST_SITE_STRINGS[parseLanguage(formData.get("language"))].guestSignIn.errors;
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const contact = String(formData.get("contact") ?? "").trim();

  if (!firstName || !lastName) {
    return { message: strings.missingName };
  }

  const guests = await listGuests();
  const result = resolveGuestForQuickSignIn(guests, firstName, lastName, contact);

  if (result === "contact_required") return { message: strings.contactRequired };
  if (result === "contact_mismatch" || result === null) return { message: strings.noMatch };

  await createGuestSession(result.id, QUICK_SIGN_IN_SESSION_MS);
  redirect("/");
}

/**
 * Sign-in via WeChat handle — an alternate identifier for guests who don't
 * use email or phone. If the matched guest has no name on file yet, they're
 * prompted to complete onboarding (first name, last name, contact info)
 * before seeing the rest of the site.
 */
export async function wechatGuestSignIn(
  _prevState: QuickSignInState,
  formData: FormData,
): Promise<QuickSignInState> {
  const strings = GUEST_SITE_STRINGS[parseLanguage(formData.get("language"))].guestSignIn.errors;
  const wechatHandle = String(formData.get("wechatHandle") ?? "").trim();
  if (!wechatHandle) return { message: strings.missingWechat };

  const guests = await listGuests();
  const guest = findGuestByWechatHandle(guests, wechatHandle);
  if (!guest) return { message: strings.wechatNoMatch };

  await createGuestSession(guest.id, QUICK_SIGN_IN_SESSION_MS);
  redirect("/");
}

export async function signOutGuest(): Promise<void> {
  await deleteGuestSession();
  redirect("/");
}
