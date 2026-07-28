"use server";

import { revalidatePath } from "next/cache";
import { getGuestSession } from "@/lib/guest-auth/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isLocalTestMode } from "@/lib/local-test";
import { canPreviewGuestView } from "@/lib/guest-preview";
import { contactEditableGuests } from "@/lib/guest-site/contact-editable-guests";
import { guestDisplayName } from "@/lib/guest-site/party-names";
import {
  CONTACT_INFO_SUCCESS_MESSAGE,
  type ContactInfoEntry,
} from "./contact-info";
import { mockUpdateGuest } from "./mock-store";
import { getGuestById, listGuests } from "./queries";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Guest-facing contact details form — verify or update name, email, and phone
 * for the signed-in guest plus anyone linked as their plus-one or RSVP
 * delegatee.
 */
export async function submitContactInfo(
  entries: ContactInfoEntry[],
  previewGuestId?: string,
): Promise<{ message?: string }> {
  const session = await getGuestSession();
  const canPreview = await canPreviewGuestView();
  const actingGuestId = canPreview && previewGuestId ? previewGuestId : session?.guestId;
  if (!actingGuestId) return { message: "Your session has expired — please sign in again." };

  if (entries.length === 0) return {};

  const actingGuest = await getGuestById(actingGuestId);
  if (!actingGuest) return { message: "Your session has expired — please sign in again." };

  const allGuests = await listGuests();
  const allowedGuestIds = new Set(
    contactEditableGuests(actingGuest, allGuests).map((guest) => guest.id),
  );

  for (const entry of entries) {
    if (!allowedGuestIds.has(entry.guestId)) {
      return { message: "You're not able to update that guest's details." };
    }

    const trimmedEmail = entry.email.trim();
    const trimmedPhone = entry.phone.trim();
    const trimmedLastName = entry.lastName.trim();

    if (!trimmedEmail && !trimmedPhone) {
      const existing = allGuests.find((guest) => guest.id === entry.guestId);
      if (!existing?.email && !existing?.phone) {
        const label = existing ? guestDisplayName(existing) : "each guest";
        return { message: `Please add an email or phone number for ${label}.` };
      }
    }

    if (trimmedEmail && !EMAIL_PATTERN.test(trimmedEmail)) {
      return { message: "Enter a valid email address." };
    }
  }

  if (isLocalTestMode()) {
    for (const entry of entries) {
      mockUpdateGuest(entry.guestId, {
        lastName: entry.lastName.trim() || null,
        email: entry.email.trim() || null,
        phone: entry.phone.trim() || null,
      });
    }
  } else {
    const supabase = getSupabaseAdmin();
    for (const entry of entries) {
      const { error } = await supabase
        .from("guests")
        .update({
          last_name: entry.lastName.trim() || null,
          email: entry.email.trim() || null,
          phone: entry.phone.trim() || null,
        })
        .eq("id", entry.guestId);
      if (error) return { message: `Could not save your details: ${error.message}` };
    }
  }

  revalidatePath("/");
  revalidatePath("/guest");
  revalidatePath("/admin/guests");
  return { message: CONTACT_INFO_SUCCESS_MESSAGE };
}
