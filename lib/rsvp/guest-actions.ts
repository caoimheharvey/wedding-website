"use server";

import { revalidatePath } from "next/cache";
import { getGuestSession } from "@/lib/guest-auth/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isLocalTestMode } from "@/lib/local-test";
import { canPreviewGuestView } from "@/lib/guest-preview";
import { mockSetGuestRsvpStatus } from "@/lib/guests/mock-store";
import { listGuests } from "@/lib/guests/queries";
import { RSVP_STATUS_OPTIONS, type RsvpStatus } from "@/lib/guests/types";

export interface RsvpEntry {
  guestId: string;
  status: RsvpStatus;
}

/**
 * Guest-facing RSVP submission. Authorization is derived entirely from the
 * signed session — never from anything the client claims — and a guest may
 * only set status for themselves or for guests whose rsvp_delegate_of points
 * at them (a default the guest being spoken for can always override, but a
 * delegate can't submit for someone unrelated to them).
 *
 * `previewGuestId` lets an admin preview route exercise this without a real
 * guest session. It's ignored unless the caller is in local test mode or
 * signed in as an admin, so it can't be used to bypass auth in production.
 */
export async function submitRsvp(
  entries: RsvpEntry[],
  previewGuestId?: string,
): Promise<{ message?: string }> {
  const session = await getGuestSession();
  const canPreview = await canPreviewGuestView();
  const actingGuestId = canPreview && previewGuestId ? previewGuestId : session?.guestId;
  if (!actingGuestId) return { message: "Your session has expired — please sign in again." };

  if (entries.length === 0) return {};

  for (const entry of entries) {
    if (!RSVP_STATUS_OPTIONS.includes(entry.status)) {
      return { message: "Invalid RSVP status." };
    }
  }

  const allGuests = await listGuests();
  const allowedGuestIds = new Set<string>([actingGuestId]);
  for (const guest of allGuests) {
    if (guest.rsvpDelegateOf === actingGuestId) allowedGuestIds.add(guest.id);
  }

  for (const entry of entries) {
    if (!allowedGuestIds.has(entry.guestId)) {
      return { message: "You're not able to update that guest's RSVP." };
    }
  }

  if (isLocalTestMode()) {
    for (const entry of entries) {
      mockSetGuestRsvpStatus(entry.guestId, entry.status);
    }
  } else {
    const supabase = getSupabaseAdmin();
    for (const entry of entries) {
      const { error } = await supabase
        .from("guests")
        .update({ rsvp_status: entry.status })
        .eq("id", entry.guestId);
      if (error) return { message: `Could not save your RSVP: ${error.message}` };
    }
  }

  revalidatePath("/guest");
  revalidatePath("/admin/guests");
  return { message: "Thanks — your RSVP has been recorded." };
}
