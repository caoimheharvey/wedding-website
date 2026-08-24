"use server";

import { revalidatePath } from "next/cache";
import { getGuestSession } from "@/lib/guest-auth/session";
import { canPreviewGuestView } from "@/lib/guest-preview";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isLocalTestMode } from "@/lib/local-test";
import { getGuestById } from "@/lib/guests/queries";
import { mockDeleteChild, mockInsertChild } from "./mock-store";
import { listChildrenForGuest } from "./queries";

async function resolveActingGuestId(
  formData: FormData,
): Promise<string | { message: string }> {
  const session = await getGuestSession();
  const canPreview = await canPreviewGuestView();
  const previewGuestId = String(formData.get("previewGuestId") ?? "").trim() || undefined;
  const actingGuestId = canPreview && previewGuestId ? previewGuestId : session?.guestId;
  if (!actingGuestId) return { message: "Your session has expired — please sign in again." };
  return actingGuestId;
}

/** Guest-facing "add a child" form — appends to the list, doesn't replace it. */
export async function addChild(
  _prevState: { message?: string } | undefined,
  formData: FormData,
): Promise<{ message?: string }> {
  const resolved = await resolveActingGuestId(formData);
  if (typeof resolved !== "string") return resolved;
  const actingGuestId = resolved;

  const actingGuest = await getGuestById(actingGuestId);
  if (!actingGuest) return { message: "Your session has expired — please sign in again." };
  if (!actingGuest.childrenAllowed) return { message: "You're not able to add children." };

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  if (!firstName) return { message: "Enter the child's first name." };

  if (isLocalTestMode()) {
    mockInsertChild({ guestId: actingGuestId, firstName, lastName: lastName || null });
  } else {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("guest_children").insert({
      guest_id: actingGuestId,
      first_name: firstName,
      last_name: lastName || null,
    });
    if (error) return { message: `Could not save: ${error.message}` };
  }

  revalidatePath("/");
  revalidatePath("/guest");
  revalidatePath("/admin/guests");
  return {};
}

export async function removeChild(
  childId: string,
  previewGuestId?: string,
): Promise<{ message?: string }> {
  const session = await getGuestSession();
  const canPreview = await canPreviewGuestView();
  const actingGuestId = canPreview && previewGuestId ? previewGuestId : session?.guestId;
  if (!actingGuestId) return { message: "Your session has expired — please sign in again." };

  const existing = await listChildrenForGuest(actingGuestId);
  if (!existing.some((child) => child.id === childId)) {
    return { message: "You're not able to remove that child." };
  }

  if (isLocalTestMode()) {
    mockDeleteChild(childId);
  } else {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("guest_children").delete().eq("id", childId);
    if (error) return { message: `Could not remove: ${error.message}` };
  }

  revalidatePath("/");
  revalidatePath("/guest");
  revalidatePath("/admin/guests");
  return {};
}
