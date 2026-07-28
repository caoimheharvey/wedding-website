"use server";

import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { getGuestByEmail, listGuests } from "@/lib/guests/queries";
import { resolveGuestForQuickSignIn } from "@/lib/guests/guest-lookup";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isLocalTestMode } from "@/lib/local-test";
import { sendMagicLinkEmail } from "@/lib/email/resend";
import { createGuestSession, deleteGuestSession } from "./session";
import { mockConsumeGuestLoginToken, mockCreateGuestLoginToken } from "./mock-store";

const TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes
const QUICK_SIGN_IN_SESSION_MS = 12 * 60 * 60 * 1000; // 12 hours

// Deliberately vague — don't confirm whether the name or the contact detail
// was the part that didn't match.
const QUICK_SIGN_IN_ERROR =
  "We couldn't find a match for those details. Double-check your first and last name, or ask whoever sent your invitation.";

const CONTACT_REQUIRED_ERROR =
  "Enter the email or phone number we have on file for you.";

// Always the same response whether or not the email matched a guest —
// otherwise this endpoint could be used to probe who's on the guest list.
const GENERIC_MESSAGE = "If that email is on the guest list, we've sent a sign-in link.";

export type GuestLoginRequestState = { message?: string; devLink?: string } | undefined;

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

export async function requestGuestLoginLink(
  _prevState: GuestLoginRequestState,
  formData: FormData,
): Promise<GuestLoginRequestState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { message: "Enter your email address." };

  const guest = await getGuestByEmail(email);
  if (!guest || !guest.email) return { message: GENERIC_MESSAGE };

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  if (isLocalTestMode()) {
    mockCreateGuestLoginToken(guest.id, tokenHash, expiresAt);
  } else {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("guest_login_tokens").insert({
      guest_id: guest.id,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
    });
    if (error) return { message: `Could not create a sign-in link: ${error.message}` };
  }

  const link = `${getSiteUrl()}/guest/verify?token=${rawToken}`;

  if (isLocalTestMode()) {
    // No email sending in local test mode — hand the link back directly so
    // the flow can be exercised without a real inbox.
    return { message: GENERIC_MESSAGE, devLink: link };
  }

  try {
    await sendMagicLinkEmail(guest.email, guest.firstName, link, guest.preferredLanguage);
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "Could not send the sign-in email.",
    };
  }

  return { message: GENERIC_MESSAGE };
}

export async function verifyGuestLoginToken(rawToken: string): Promise<string | null> {
  const tokenHash = hashToken(rawToken);

  if (isLocalTestMode()) {
    return mockConsumeGuestLoginToken(tokenHash);
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("guest_login_tokens")
    .select("id, guest_id, expires_at, used_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error || !data || data.used_at) return null;
  if (new Date(data.expires_at) < new Date()) return null;

  const { error: updateError } = await supabase
    .from("guest_login_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", data.id);
  if (updateError) return null;

  return data.guest_id;
}

export type QuickSignInState = { message?: string } | undefined;

/**
 * Sign-in for guests who won't reliably check email for a link — matches
 * first and last name (case-insensitive). When we already have an email or
 * phone on file, that detail must match too. Guests with no contact info on
 * file can sign in by name alone and are prompted to add details before
 * viewing the rest of the site.
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
