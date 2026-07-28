"use server";

import { revalidatePath } from "next/cache";
import { getGuestSession } from "@/lib/guest-auth/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isLocalTestMode } from "@/lib/local-test";
import { mockUpdateGuest } from "./mock-store";
import { getGuestById } from "./queries";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Guest-facing "give us your contact info" submission — for a guest who was
 * handed the site link directly instead of being emailed/texted it, and so
 * has neither an email nor phone on file yet. Lets them self-report either
 * or both so future updates can reach them normally.
 *
 * Only fills gaps: refuses if the guest already has an email or phone on
 * file, since this exists for guests missing *all* contact info, not as a
 * general self-service edit form.
 *
 * `previewGuestId` mirrors lib/rsvp/guest-actions.ts's submitRsvp — local-test-
 * only, lets the admin preview route exercise this without a real session.
 */
export async function submitContactInfo(
  email: string,
  phone: string,
  previewGuestId?: string,
): Promise<{ message?: string }> {
  const session = await getGuestSession();
  const actingGuestId = isLocalTestMode() && previewGuestId ? previewGuestId : session?.guestId;
  if (!actingGuestId) return { message: "Your session has expired — please sign in again." };

  const trimmedEmail = email.trim();
  const trimmedPhone = phone.trim();
  if (!trimmedEmail && !trimmedPhone) {
    return { message: "Enter an email or phone number." };
  }
  if (trimmedEmail && !EMAIL_PATTERN.test(trimmedEmail)) {
    return { message: "Enter a valid email address." };
  }

  const guest = await getGuestById(actingGuestId);
  if (!guest) return { message: "Your session has expired — please sign in again." };
  if (guest.email || guest.phone) {
    return { message: "You're already set up to receive updates." };
  }

  const update = { email: trimmedEmail || null, phone: trimmedPhone || null };

  if (isLocalTestMode()) {
    mockUpdateGuest(actingGuestId, update);
  } else {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("guests").update(update).eq("id", actingGuestId);
    if (error) return { message: `Could not save your details: ${error.message}` };
  }

  revalidatePath("/guest");
  revalidatePath("/admin/guests");
  return { message: "Thanks — we'll keep you posted!" };
}
