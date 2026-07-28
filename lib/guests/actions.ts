"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/dal";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isLocalTestMode } from "@/lib/local-test";
import { guestFormSchema } from "./schema";
import { countLinkedPlusOnes, getGuestById } from "./queries";
import { mockDeleteGuest, mockInsertGuest, mockSetGuestRsvpDelegates, mockUpdateGuest } from "./mock-store";
import type { Guest } from "./types";

export type GuestActionState =
  | { errors: Record<string, string[] | undefined>; message?: string }
  | { errors?: undefined; message?: string }
  | undefined;

function parseGuestForm(formData: FormData) {
  return guestFormSchema.safeParse({
    ...Object.fromEntries(formData),
    partyRoles: formData.getAll("partyRoles"),
    rsvpDelegateIds: formData.getAll("rsvpDelegateIds"),
  });
}

function toGuestRow(values: z.infer<typeof guestFormSchema>) {
  return {
    first_name: values.firstName,
    last_name: values.lastName?.trim() || null,
    email: values.email || null,
    phone: values.phone || null,
    relationship_priority: values.relationshipPriority,
    preferred_language: values.preferredLanguage,
    party_roles: values.partyRoles,
    is_plus_one_of: values.isPlusOneOf || null,
    invited_by: values.invitedBy,
    rsvp_deadline_override: values.rsvpDeadlineOverride || null,
    rsvp_status: values.rsvpStatus,
    notes: values.notes || null,
  };
}

function toGuestFields(
  values: z.infer<typeof guestFormSchema>,
): Omit<Guest, "id" | "createdAt" | "updatedAt" | "seatingTableId"> {
  return {
    firstName: values.firstName,
    lastName: values.lastName?.trim() || null,
    email: values.email || null,
    phone: values.phone || null,
    relationshipPriority: values.relationshipPriority as Guest["relationshipPriority"],
    preferredLanguage: values.preferredLanguage,
    partyRoles: values.partyRoles,
    isPlusOneOf: values.isPlusOneOf || null,
    plusOneStatus: null,
    plusOneRequestedRelationship: null,
    invitedBy: values.invitedBy,
    rsvpDeadlineOverride: values.rsvpDeadlineOverride || null,
    rsvpStatus: values.rsvpStatus,
    notes: values.notes || null,
  };
}

async function validateLinkedGuest(guestId: string | undefined, label: string) {
  if (!guestId) return null;
  const target = await getGuestById(guestId);
  if (!target) return `The selected ${label} no longer exists.`;
  return null;
}

async function validateDelegateIds(guestId: string | undefined, delegateIds: string[]) {
  const unique = [...new Set(delegateIds)];
  if (guestId && unique.includes(guestId)) {
    return "A guest cannot be their own RSVP delegate.";
  }
  for (const delegateId of unique) {
    const error = await validateLinkedGuest(delegateId, "RSVP delegate");
    if (error) return error;
  }
  return null;
}

async function syncGuestRsvpDelegates(guestId: string, delegateIds: string[]) {
  const unique = [...new Set(delegateIds.filter((id) => id !== guestId))];
  if (isLocalTestMode()) {
    mockSetGuestRsvpDelegates(guestId, unique);
    return;
  }

  const supabase = getSupabaseAdmin();
  const { error: deleteError } = await supabase
    .from("guest_rsvp_delegates")
    .delete()
    .eq("guest_id", guestId);
  if (deleteError) throw new Error(deleteError.message);

  if (unique.length === 0) return;

  const { error: insertError } = await supabase.from("guest_rsvp_delegates").insert(
    unique.map((delegateId) => ({
      guest_id: guestId,
      delegate_id: delegateId,
    })),
  );
  if (insertError) throw new Error(insertError.message);
}

export async function createGuest(
  _prevState: GuestActionState,
  formData: FormData,
): Promise<GuestActionState> {
  await requireAdmin();

  const parsed = parseGuestForm(formData);
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  const plusOneError = await validateLinkedGuest(parsed.data.isPlusOneOf, "plus-one link");
  if (plusOneError) return { message: plusOneError };

  const delegateError = await validateDelegateIds(undefined, parsed.data.rsvpDelegateIds);
  if (delegateError) return { message: delegateError };

  if (isLocalTestMode()) {
    const guest = mockInsertGuest(toGuestFields(parsed.data));
    mockSetGuestRsvpDelegates(guest.id, parsed.data.rsvpDelegateIds);
  } else {
    const supabase = getSupabaseAdmin();
    const { data: inserted, error } = await supabase
      .from("guests")
      .insert(toGuestRow(parsed.data))
      .select("id")
      .single();
    if (error || !inserted) {
      return { message: `Could not save guest: ${error?.message ?? "Unknown error"}` };
    }
    try {
      await syncGuestRsvpDelegates(inserted.id, parsed.data.rsvpDelegateIds);
    } catch (syncError) {
      return {
        message:
          syncError instanceof Error ? syncError.message : "Could not save RSVP delegates.",
      };
    }
  }

  revalidatePath("/admin/guests");
  redirect("/admin/guests");
}

export async function updateGuest(
  guestId: string,
  _prevState: GuestActionState,
  formData: FormData,
): Promise<GuestActionState> {
  await requireAdmin();

  const parsed = parseGuestForm(formData);
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  if (parsed.data.isPlusOneOf === guestId) {
    return { message: "A guest cannot be linked as their own plus-one." };
  }

  const plusOneError = await validateLinkedGuest(parsed.data.isPlusOneOf, "plus-one link");
  if (plusOneError) return { message: plusOneError };

  const delegateError = await validateDelegateIds(guestId, parsed.data.rsvpDelegateIds);
  if (delegateError) return { message: delegateError };

  if (isLocalTestMode()) {
    mockUpdateGuest(guestId, toGuestFields(parsed.data));
    mockSetGuestRsvpDelegates(guestId, parsed.data.rsvpDelegateIds);
  } else {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("guests")
      .update(toGuestRow(parsed.data))
      .eq("id", guestId);

    if (error) {
      return { message: `Could not save guest: ${error.message}` };
    }
    try {
      await syncGuestRsvpDelegates(guestId, parsed.data.rsvpDelegateIds);
    } catch (syncError) {
      return {
        message:
          syncError instanceof Error ? syncError.message : "Could not save RSVP delegates.",
      };
    }
  }

  revalidatePath("/admin/guests");
  return { message: "Guest updated." };
}

export async function deleteGuest(guestId: string): Promise<{ message?: string }> {
  await requireAdmin();

  const linkedPlusOnes = await countLinkedPlusOnes(guestId);

  if (isLocalTestMode()) {
    mockDeleteGuest(guestId);
  } else {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("guests").delete().eq("id", guestId);
    if (error) {
      return { message: `Could not delete guest: ${error.message}` };
    }
  }

  revalidatePath("/admin/guests");
  return linkedPlusOnes > 0
    ? { message: `Guest deleted. ${linkedPlusOnes} linked plus-one(s) were unlinked, not deleted.` }
    : {};
}
