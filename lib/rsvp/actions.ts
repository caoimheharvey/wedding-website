"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isLocalTestMode } from "@/lib/local-test";
import { mockSetGuestRsvpStatus, mockSetRsvpDeadlineOverrides } from "@/lib/guests/mock-store";
import { RSVP_STATUS_OPTIONS, type RsvpStatus } from "@/lib/guests/types";
import {
  mockUpdateBackgroundImage,
  mockUpdateDefaultRsvpDeadline,
  mockUpdateWeddingDate,
  mockUpdateWeddingLocation,
} from "./mock-store";

const deadlineSchema = z.union([z.iso.date(), z.literal("")]).optional();

export async function updateDefaultRsvpDeadline(
  deadline: string | null,
): Promise<{ message?: string }> {
  await requireAdmin();

  const parsed = deadlineSchema.safeParse(deadline ?? "");
  if (!parsed.success) return { message: "Enter a valid date." };

  const value = parsed.data || null;

  if (isLocalTestMode()) {
    mockUpdateDefaultRsvpDeadline(value);
  } else {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("site_settings")
      .update({ default_rsvp_deadline: value })
      .eq("id", 1);
    if (error) return { message: `Could not save: ${error.message}` };
  }

  revalidatePath("/admin/guests");
  revalidatePath("/admin/overview");
  return {};
}

export async function updateWeddingDate(date: string | null): Promise<{ message?: string }> {
  await requireAdmin();

  const parsed = deadlineSchema.safeParse(date ?? "");
  if (!parsed.success) return { message: "Enter a valid date." };

  const value = parsed.data || null;

  if (isLocalTestMode()) {
    mockUpdateWeddingDate(value);
  } else {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("site_settings")
      .update({ wedding_date: value })
      .eq("id", 1);
    if (error) return { message: `Could not save: ${error.message}` };
  }

  revalidatePath("/admin/overview");
  revalidatePath("/admin/planning");
  revalidatePath("/");
  return {};
}

export async function updateWeddingLocation(
  location: string | null,
): Promise<{ message?: string }> {
  await requireAdmin();

  const value = location?.trim() || null;

  if (isLocalTestMode()) {
    mockUpdateWeddingLocation(value);
  } else {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("site_settings")
      .update({ wedding_location: value })
      .eq("id", 1);
    if (error) return { message: `Could not save: ${error.message}` };
  }

  revalidatePath("/admin/overview");
  revalidatePath("/");
  return {};
}

/** Translucent backdrop for the guest-facing site — reuses the same storage
 *  bucket as Guest View images, in its own "site-background" folder. */
export async function updateBackgroundImage(
  _prevState: { message?: string } | undefined,
  formData: FormData,
): Promise<{ message?: string }> {
  await requireAdmin();

  const file = formData.get("backgroundImage");
  let url: string | null = null;

  if (file instanceof File && file.size > 0) {
    if (isLocalTestMode()) {
      const buffer = Buffer.from(await file.arrayBuffer());
      url = `data:${file.type || "image/jpeg"};base64,${buffer.toString("base64")}`;
    } else {
      const supabase = getSupabaseAdmin();
      const extension = file.name.split(".").pop() || "jpg";
      const path = `site-background/${crypto.randomUUID()}.${extension}`;
      const { error } = await supabase.storage
        .from("guest-view-images")
        .upload(path, file, { contentType: file.type || undefined, upsert: true });
      if (error) return { message: `Could not upload image: ${error.message}` };
      const { data } = supabase.storage.from("guest-view-images").getPublicUrl(path);
      url = data.publicUrl;
    }
  }

  if (isLocalTestMode()) {
    mockUpdateBackgroundImage(url);
  } else {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("site_settings")
      .update({ background_image_url: url })
      .eq("id", 1);
    if (error) return { message: `Could not save: ${error.message}` };
  }

  revalidatePath("/admin/overview");
  revalidatePath("/");
  revalidatePath("/guest");
  return { message: "Background image updated." };
}

export async function removeBackgroundImage(): Promise<{ message?: string }> {
  await requireAdmin();

  if (isLocalTestMode()) {
    mockUpdateBackgroundImage(null);
  } else {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("site_settings")
      .update({ background_image_url: null })
      .eq("id", 1);
    if (error) return { message: `Could not remove image: ${error.message}` };
  }

  revalidatePath("/admin/overview");
  revalidatePath("/");
  revalidatePath("/guest");
  return {};
}

export async function setGuestRsvpDeadlineOverrides(
  guestIds: string[],
  deadline: string | null,
): Promise<{ message?: string }> {
  await requireAdmin();

  if (guestIds.length === 0) return {};

  if (deadline !== null) {
    const parsed = z.iso.date().safeParse(deadline);
    if (!parsed.success) return { message: "Enter a valid date." };
  }

  if (isLocalTestMode()) {
    mockSetRsvpDeadlineOverrides(guestIds, deadline);
  } else {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("guests")
      .update({ rsvp_deadline_override: deadline })
      .in("id", guestIds);
    if (error) return { message: `Could not update RSVP deadlines: ${error.message}` };
  }

  revalidatePath("/admin/guests");
  return {
    message: deadline
      ? `RSVP deadline set for ${guestIds.length} guest(s).`
      : `RSVP deadline override cleared for ${guestIds.length} guest(s).`,
  };
}

export async function setGuestRsvpStatus(
  guestId: string,
  status: RsvpStatus,
): Promise<{ message?: string }> {
  await requireAdmin();

  if (!RSVP_STATUS_OPTIONS.includes(status)) {
    return { message: "Invalid RSVP status." };
  }

  if (isLocalTestMode()) {
    mockSetGuestRsvpStatus(guestId, status);
  } else {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("guests")
      .update({ rsvp_status: status })
      .eq("id", guestId);
    if (error) return { message: `Could not update RSVP status: ${error.message}` };
  }

  revalidatePath("/admin/guests");
  return {};
}
