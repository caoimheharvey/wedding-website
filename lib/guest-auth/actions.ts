"use server";

import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { findGuestByNameAndContact, getGuestByEmail } from "@/lib/guests/queries";
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
  "We couldn't find a match for that name and email/phone. Double-check the spelling, or ask whoever sent your invitation.";

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
 * name + a contact detail already on file and starts a session immediately,
 * no email/SMS round trip. Session is short (12h) rather than the 30-day
 * magic-link session, since matching is weaker (guessable name + a detail a
 * family member might also know) and this is meant for a quick check-in on
 * a shared device, not a long-lived sign-in.
 */
export async function quickGuestSignIn(
  _prevState: QuickSignInState,
  formData: FormData,
): Promise<QuickSignInState> {
  const name = String(formData.get("name") ?? "").trim();
  const contact = String(formData.get("contact") ?? "").trim();
  if (!name || !contact) return { message: "Enter your name and your email or phone number." };

  const guest = await findGuestByNameAndContact(name, contact);
  if (!guest) return { message: QUICK_SIGN_IN_ERROR };

  await createGuestSession(guest.id, QUICK_SIGN_IN_SESSION_MS);
  redirect("/");
}

export async function signOutGuest(): Promise<void> {
  await deleteGuestSession();
  redirect("/guest/sign-in");
}
