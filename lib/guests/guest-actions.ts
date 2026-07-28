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
  guestNeedsLastName,
  type ContactInfoEntry,
} from "./contact-info";
import { DIETARY_SUCCESS_MESSAGE } from "./dietary-info";
import { formatStoredPhoneForCountry } from "@/lib/phone/format";
import { mockUpdateGuest } from "./mock-store";
import { getGuestById, listGuests, listRsvpDelegatePairs } from "./queries";
import { rsvpSubmitteesFor } from "./rsvp-delegates";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Guest-facing contact details form — update name, email, and phone for the
 * signed-in guest (onboarding) or for plus-ones and RSVP delegatees.
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

  const [allGuests, pairs] = await Promise.all([listGuests(), listRsvpDelegatePairs()]);
  const allowedGuestIds = new Set<string>([actingGuestId]);
  for (const guest of contactEditableGuests(actingGuest, allGuests, pairs)) {
    allowedGuestIds.add(guest.id);
  }

  for (const entry of entries) {
    if (!allowedGuestIds.has(entry.guestId)) {
      return { message: "You're not able to update that guest's details." };
    }

    const trimmedEmail = entry.email.trim();
    const trimmedPhoneNational = entry.phoneNational.trim();
    const formattedPhone = trimmedPhoneNational
      ? formatStoredPhoneForCountry(entry.phoneCountryId, entry.phoneNational)
      : null;
    const existing = allGuests.find((guest) => guest.id === entry.guestId);

    if (!trimmedEmail && !formattedPhone) {
      if (!existing?.email && !existing?.phone) {
        const label = existing ? guestDisplayName(existing) : "each guest";
        return { message: `Please add an email or phone number for ${label}.` };
      }
    }

    if (trimmedPhoneNational && !formattedPhone) {
      return { message: "Enter a valid phone number for your selected country." };
    }

    if (trimmedEmail && !EMAIL_PATTERN.test(trimmedEmail)) {
      return { message: "Enter a valid email address." };
    }
  }

  if (isLocalTestMode()) {
    for (const entry of entries) {
      const existing = allGuests.find((guest) => guest.id === entry.guestId);
      const formattedPhone = entry.phoneNational.trim()
        ? formatStoredPhoneForCountry(entry.phoneCountryId, entry.phoneNational)
        : null;
      mockUpdateGuest(entry.guestId, {
        lastName: guestNeedsLastName(existing ?? { lastName: null })
          ? entry.lastName.trim() || null
          : existing?.lastName ?? null,
        email: entry.email.trim() || null,
        phone: formattedPhone,
      });
    }
  } else {
    const supabase = getSupabaseAdmin();
    for (const entry of entries) {
      const existing = allGuests.find((guest) => guest.id === entry.guestId);
      const formattedPhone = entry.phoneNational.trim()
        ? formatStoredPhoneForCountry(entry.phoneCountryId, entry.phoneNational)
        : null;
      const { error } = await supabase
        .from("guests")
        .update({
          last_name: guestNeedsLastName(existing ?? { lastName: null })
            ? entry.lastName.trim() || null
            : existing?.lastName ?? null,
          email: entry.email.trim() || null,
          phone: formattedPhone,
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

export async function submitDietaryRestrictions(
  _prevState: { message?: string } | undefined,
  formData: FormData,
): Promise<{ message?: string }> {
  const session = await getGuestSession();
  const canPreview = await canPreviewGuestView();
  const previewGuestId = String(formData.get("previewGuestId") ?? "").trim() || undefined;
  const actingGuestId = canPreview && previewGuestId ? previewGuestId : session?.guestId;
  if (!actingGuestId) return { message: "Your session has expired — please sign in again." };

  const actingGuest = await getGuestById(actingGuestId);
  if (!actingGuest) return { message: "Your session has expired — please sign in again." };

  const [allGuests, pairs] = await Promise.all([listGuests(), listRsvpDelegatePairs()]);
  const allowedGuestIds = new Set(
    rsvpSubmitteesFor(actingGuest, allGuests, pairs).map((guest) => guest.id),
  );

  const updates: Array<{ guestId: string; dietaryRestrictions: string | null }> = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("dietary_")) continue;
    const guestId = key.slice("dietary_".length);
    if (!allowedGuestIds.has(guestId)) {
      return { message: "You're not able to update that guest's dietary details." };
    }
    updates.push({
      guestId,
      dietaryRestrictions: String(value).trim() || null,
    });
  }

  if (updates.length === 0) return {};

  if (isLocalTestMode()) {
    for (const update of updates) {
      mockUpdateGuest(update.guestId, { dietaryRestrictions: update.dietaryRestrictions });
    }
  } else {
    const supabase = getSupabaseAdmin();
    for (const update of updates) {
      const { error } = await supabase
        .from("guests")
        .update({ dietary_restrictions: update.dietaryRestrictions })
        .eq("id", update.guestId);
      if (error) return { message: `Could not save dietary details: ${error.message}` };
    }
  }

  revalidatePath("/");
  revalidatePath("/guest");
  revalidatePath("/admin/guests");
  return { message: DIETARY_SUCCESS_MESSAGE };
}
