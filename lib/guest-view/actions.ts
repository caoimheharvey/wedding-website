"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isLocalTestMode } from "@/lib/local-test";
import {
  mockCreateContactInfoSection,
  mockCreateBuiltinSection,
  mockCreateEmbedGroupSection,
  mockCreateImageGroupSection,
  mockCreateRsvpSection,
  mockCreateRsvpStatusSection,
  mockCreateTextSection,
  mockDeleteGuestViewSection,
  mockMoveGuestViewSection,
  mockUpdateContactInfoSection,
  mockUpdateBuiltinSection,
  mockUpdateEmbedGroupSection,
  mockUpdateImageGroupSection,
  mockUpdateRsvpSection,
  mockUpdateRsvpStatusSection,
  mockUpdateTextSection,
  type MockImageInput,
} from "./mock-store";
import { listGuestViewSections } from "./queries";
import {
  contactInfoSectionFormSchema,
  embedGroupFormSchema,
  embedItemSchema,
  imageGroupFormSchema,
  rsvpSectionFormSchema,
  rsvpStatusSectionFormSchema,
  textSectionFormSchema,
  builtinSectionFormSchema,
} from "./schema";
import type { GuestViewSectionType } from "./types";

export type GuestViewSectionActionState =
  | { errors: Record<string, string[] | undefined>; message?: string }
  | { errors?: undefined; message?: string }
  | undefined;

function parseVisibleToRoles(formData: FormData) {
  return formData.getAll("visibleToRoles");
}

function parseEmbeds(formData: FormData): z.infer<typeof embedItemSchema>[] {
  const providers = formData.getAll("embedProvider");
  const urls = formData.getAll("embedUrl");
  const captions = formData.getAll("embedCaption");
  const embeds: z.infer<typeof embedItemSchema>[] = [];

  for (let i = 0; i < urls.length; i++) {
    if (!urls[i]) continue;
    const parsed = embedItemSchema.safeParse({
      provider: providers[i],
      url: urls[i],
      caption: captions[i],
    });
    if (parsed.success) embeds.push(parsed.data);
  }
  return embeds;
}

interface ImageRowInput {
  file: File | null;
  existingUrl: string;
  caption: string;
}

function parseImageRows(formData: FormData): ImageRowInput[] {
  const files = formData.getAll("imageFile");
  const existingUrls = formData.getAll("imageExistingUrl");
  const captions = formData.getAll("imageCaption");

  return captions.map((caption, i) => {
    const fileEntry = files[i];
    return {
      file: fileEntry instanceof File && fileEntry.size > 0 ? fileEntry : null,
      existingUrl: String(existingUrls[i] ?? ""),
      caption: String(caption),
    };
  });
}

/** Uploads a new file (real Supabase Storage, or a data URL in local test
 *  mode) or falls back to the row's existing URL when no new file was
 *  chosen. Returns null for an empty row (no file, no existing image). */
async function resolveImageUrl(uploadFolder: string, row: ImageRowInput): Promise<string | null> {
  if (!row.file) return row.existingUrl || null;

  if (isLocalTestMode()) {
    const buffer = Buffer.from(await row.file.arrayBuffer());
    return `data:${row.file.type || "image/jpeg"};base64,${buffer.toString("base64")}`;
  }

  const supabase = getSupabaseAdmin();
  const extension = row.file.name.split(".").pop() || "jpg";
  const path = `${uploadFolder}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from("guest-view-images")
    .upload(path, row.file, { contentType: row.file.type || undefined, upsert: true });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from("guest-view-images").getPublicUrl(path);
  return data.publicUrl;
}

async function resolveImages(
  uploadFolder: string,
  rows: ImageRowInput[],
): Promise<MockImageInput[]> {
  const resolved = await Promise.all(
    rows.map(async (row) => {
      const url = await resolveImageUrl(uploadFolder, row);
      return url ? { url, caption: row.caption } : null;
    }),
  );
  return resolved.filter((image): image is MockImageInput => image !== null);
}

export async function createImageGroupSection(
  _prevState: GuestViewSectionActionState,
  formData: FormData,
): Promise<GuestViewSectionActionState> {
  await requireAdmin();

  const parsed = imageGroupFormSchema.safeParse({
    ...Object.fromEntries(formData),
    visibleToRoles: parseVisibleToRoles(formData),
  });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };

  let images: MockImageInput[];
  try {
    images = await resolveImages(crypto.randomUUID(), parseImageRows(formData));
  } catch (error) {
    return { message: error instanceof Error ? error.message : "Could not upload images." };
  }

  const existing = await listGuestViewSections();
  const orderIndex = existing.length;

  if (isLocalTestMode()) {
    mockCreateImageGroupSection(parsed.data, images, orderIndex);
  } else {
    const supabase = getSupabaseAdmin();
    const { data: inserted, error } = await supabase
      .from("guest_view_sections")
      .insert({
        type: "image_group",
        title: parsed.data.title || null,
        order_index: orderIndex,
        visible_to_roles: parsed.data.visibleToRoles,
        column_count: parsed.data.columnCount,
      })
      .select("id")
      .single();
    if (error) return { message: `Could not save section: ${error.message}` };

    if (images.length > 0) {
      const { error: imagesError } = await supabase.from("guest_view_images").insert(
        images.map((image, index) => ({
          section_id: inserted.id,
          url: image.url,
          caption: image.caption || null,
          order_index: index,
        })),
      );
      if (imagesError) return { message: `Could not save images: ${imagesError.message}` };
    }
  }

  revalidatePath("/admin/guest-view");
  return { message: "Section added." };
}

export async function updateImageGroupSection(
  sectionId: string,
  _prevState: GuestViewSectionActionState,
  formData: FormData,
): Promise<GuestViewSectionActionState> {
  await requireAdmin();

  const parsed = imageGroupFormSchema.safeParse({
    ...Object.fromEntries(formData),
    visibleToRoles: parseVisibleToRoles(formData),
  });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };

  let images: MockImageInput[];
  try {
    images = await resolveImages(sectionId, parseImageRows(formData));
  } catch (error) {
    return { message: error instanceof Error ? error.message : "Could not upload images." };
  }

  if (isLocalTestMode()) {
    mockUpdateImageGroupSection(sectionId, parsed.data, images);
  } else {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("guest_view_sections")
      .update({
        title: parsed.data.title || null,
        visible_to_roles: parsed.data.visibleToRoles,
        column_count: parsed.data.columnCount,
      })
      .eq("id", sectionId);
    if (error) return { message: `Could not save section: ${error.message}` };

    const { error: deleteError } = await supabase
      .from("guest_view_images")
      .delete()
      .eq("section_id", sectionId);
    if (deleteError) return { message: `Could not save images: ${deleteError.message}` };

    if (images.length > 0) {
      const { error: insertError } = await supabase.from("guest_view_images").insert(
        images.map((image, index) => ({
          section_id: sectionId,
          url: image.url,
          caption: image.caption || null,
          order_index: index,
        })),
      );
      if (insertError) return { message: `Could not save images: ${insertError.message}` };
    }
  }

  revalidatePath("/admin/guest-view");
  return { message: "Section updated." };
}

export async function createTextSection(
  _prevState: GuestViewSectionActionState,
  formData: FormData,
): Promise<GuestViewSectionActionState> {
  await requireAdmin();

  const parsed = textSectionFormSchema.safeParse({
    ...Object.fromEntries(formData),
    visibleToRoles: parseVisibleToRoles(formData),
  });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };

  const existing = await listGuestViewSections();
  const orderIndex = existing.length;

  if (isLocalTestMode()) {
    mockCreateTextSection(parsed.data, orderIndex);
  } else {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("guest_view_sections").insert({
      type: "text",
      title: parsed.data.titleEn || null,
      title_fr: parsed.data.titleFr || null,
      title_zh: parsed.data.titleZh || null,
      order_index: orderIndex,
      visible_to_roles: parsed.data.visibleToRoles,
      body_en: parsed.data.bodyEn,
      body_fr: parsed.data.bodyFr || null,
      body_zh: parsed.data.bodyZh || null,
      column_count: parsed.data.columnCount,
    });
    if (error) return { message: `Could not save section: ${error.message}` };
  }

  revalidatePath("/admin/guest-view");
  return { message: "Section added." };
}

export async function updateTextSection(
  sectionId: string,
  _prevState: GuestViewSectionActionState,
  formData: FormData,
): Promise<GuestViewSectionActionState> {
  await requireAdmin();

  const parsed = textSectionFormSchema.safeParse({
    ...Object.fromEntries(formData),
    visibleToRoles: parseVisibleToRoles(formData),
  });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };

  if (isLocalTestMode()) {
    mockUpdateTextSection(sectionId, parsed.data);
  } else {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("guest_view_sections")
      .update({
        title: parsed.data.titleEn || null,
        title_fr: parsed.data.titleFr || null,
        title_zh: parsed.data.titleZh || null,
        visible_to_roles: parsed.data.visibleToRoles,
        body_en: parsed.data.bodyEn,
        body_fr: parsed.data.bodyFr || null,
        body_zh: parsed.data.bodyZh || null,
        column_count: parsed.data.columnCount,
      })
      .eq("id", sectionId);
    if (error) return { message: `Could not save section: ${error.message}` };
  }

  revalidatePath("/admin/guest-view");
  return { message: "Section updated." };
}

export async function createRsvpSection(
  _prevState: GuestViewSectionActionState,
  formData: FormData,
): Promise<GuestViewSectionActionState> {
  await requireAdmin();

  const parsed = rsvpSectionFormSchema.safeParse({
    ...Object.fromEntries(formData),
    visibleToRoles: parseVisibleToRoles(formData),
  });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };

  const existing = await listGuestViewSections();
  const orderIndex = existing.length;

  if (isLocalTestMode()) {
    mockCreateRsvpSection(parsed.data, orderIndex);
  } else {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("guest_view_sections").insert({
      type: "rsvp",
      title: parsed.data.title || null,
      order_index: orderIndex,
      visible_to_roles: parsed.data.visibleToRoles,
    });
    if (error) return { message: `Could not save section: ${error.message}` };
  }

  revalidatePath("/admin/guest-view");
  return { message: "Section added." };
}

export async function updateRsvpSection(
  sectionId: string,
  _prevState: GuestViewSectionActionState,
  formData: FormData,
): Promise<GuestViewSectionActionState> {
  await requireAdmin();

  const parsed = rsvpSectionFormSchema.safeParse({
    ...Object.fromEntries(formData),
    visibleToRoles: parseVisibleToRoles(formData),
  });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };

  if (isLocalTestMode()) {
    mockUpdateRsvpSection(sectionId, parsed.data);
  } else {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("guest_view_sections")
      .update({
        title: parsed.data.title || null,
        visible_to_roles: parsed.data.visibleToRoles,
      })
      .eq("id", sectionId);
    if (error) return { message: `Could not save section: ${error.message}` };
  }

  revalidatePath("/admin/guest-view");
  return { message: "Section updated." };
}

export async function createRsvpStatusSection(
  _prevState: GuestViewSectionActionState,
  formData: FormData,
): Promise<GuestViewSectionActionState> {
  await requireAdmin();

  const parsed = rsvpStatusSectionFormSchema.safeParse({
    ...Object.fromEntries(formData),
    visibleToRoles: parseVisibleToRoles(formData),
  });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };

  const existing = await listGuestViewSections();
  const orderIndex = existing.length;

  if (isLocalTestMode()) {
    mockCreateRsvpStatusSection(parsed.data, orderIndex);
  } else {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("guest_view_sections").insert({
      type: "rsvp_status",
      title: parsed.data.title || null,
      order_index: orderIndex,
      visible_to_roles: parsed.data.visibleToRoles,
    });
    if (error) return { message: `Could not save section: ${error.message}` };
  }

  revalidatePath("/admin/guest-view");
  return { message: "Section added." };
}

export async function updateRsvpStatusSection(
  sectionId: string,
  _prevState: GuestViewSectionActionState,
  formData: FormData,
): Promise<GuestViewSectionActionState> {
  await requireAdmin();

  const parsed = rsvpStatusSectionFormSchema.safeParse({
    ...Object.fromEntries(formData),
    visibleToRoles: parseVisibleToRoles(formData),
  });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };

  if (isLocalTestMode()) {
    mockUpdateRsvpStatusSection(sectionId, parsed.data);
  } else {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("guest_view_sections")
      .update({
        title: parsed.data.title || null,
        visible_to_roles: parsed.data.visibleToRoles,
      })
      .eq("id", sectionId);
    if (error) return { message: `Could not save section: ${error.message}` };
  }

  revalidatePath("/admin/guest-view");
  return { message: "Section updated." };
}

export async function createContactInfoSection(
  _prevState: GuestViewSectionActionState,
  formData: FormData,
): Promise<GuestViewSectionActionState> {
  await requireAdmin();

  const parsed = contactInfoSectionFormSchema.safeParse({
    ...Object.fromEntries(formData),
    visibleToRoles: parseVisibleToRoles(formData),
  });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };

  const existing = await listGuestViewSections();
  const orderIndex = existing.length;

  if (isLocalTestMode()) {
    mockCreateContactInfoSection(parsed.data, orderIndex);
  } else {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("guest_view_sections").insert({
      type: "contact_info",
      title: parsed.data.title || null,
      order_index: orderIndex,
      visible_to_roles: parsed.data.visibleToRoles,
    });
    if (error) return { message: `Could not save section: ${error.message}` };
  }

  revalidatePath("/admin/guest-view");
  return { message: "Section added." };
}

export async function updateContactInfoSection(
  sectionId: string,
  _prevState: GuestViewSectionActionState,
  formData: FormData,
): Promise<GuestViewSectionActionState> {
  await requireAdmin();

  const parsed = contactInfoSectionFormSchema.safeParse({
    ...Object.fromEntries(formData),
    visibleToRoles: parseVisibleToRoles(formData),
  });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };

  if (isLocalTestMode()) {
    mockUpdateContactInfoSection(sectionId, parsed.data);
  } else {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("guest_view_sections")
      .update({
        title: parsed.data.title || null,
        visible_to_roles: parsed.data.visibleToRoles,
      })
      .eq("id", sectionId);
    if (error) return { message: `Could not save section: ${error.message}` };
  }

  revalidatePath("/admin/guest-view");
  return { message: "Section updated." };
}

export async function createEmbedGroupSection(
  _prevState: GuestViewSectionActionState,
  formData: FormData,
): Promise<GuestViewSectionActionState> {
  await requireAdmin();

  const parsed = embedGroupFormSchema.safeParse({
    ...Object.fromEntries(formData),
    visibleToRoles: parseVisibleToRoles(formData),
  });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };

  const embeds = parseEmbeds(formData);
  const existing = await listGuestViewSections();
  const orderIndex = existing.length;

  if (isLocalTestMode()) {
    mockCreateEmbedGroupSection(parsed.data, embeds, orderIndex);
  } else {
    const supabase = getSupabaseAdmin();
    const { data: inserted, error } = await supabase
      .from("guest_view_sections")
      .insert({
        type: "embed_group",
        title: parsed.data.title || null,
        order_index: orderIndex,
        visible_to_roles: parsed.data.visibleToRoles,
        column_count: parsed.data.columnCount,
      })
      .select("id")
      .single();
    if (error) return { message: `Could not save section: ${error.message}` };

    if (embeds.length > 0) {
      const { error: embedsError } = await supabase.from("guest_view_embeds").insert(
        embeds.map((embed, index) => ({
          section_id: inserted.id,
          provider: embed.provider,
          url: embed.url,
          caption: embed.caption || null,
          order_index: index,
        })),
      );
      if (embedsError) return { message: `Could not save embeds: ${embedsError.message}` };
    }
  }

  revalidatePath("/admin/guest-view");
  return { message: "Section added." };
}

export async function updateEmbedGroupSection(
  sectionId: string,
  _prevState: GuestViewSectionActionState,
  formData: FormData,
): Promise<GuestViewSectionActionState> {
  await requireAdmin();

  const parsed = embedGroupFormSchema.safeParse({
    ...Object.fromEntries(formData),
    visibleToRoles: parseVisibleToRoles(formData),
  });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };

  const embeds = parseEmbeds(formData);

  if (isLocalTestMode()) {
    mockUpdateEmbedGroupSection(sectionId, parsed.data, embeds);
  } else {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("guest_view_sections")
      .update({
        title: parsed.data.title || null,
        visible_to_roles: parsed.data.visibleToRoles,
        column_count: parsed.data.columnCount,
      })
      .eq("id", sectionId);
    if (error) return { message: `Could not save section: ${error.message}` };

    // Simplest correct approach: replace all embeds for this section.
    const { error: deleteError } = await supabase
      .from("guest_view_embeds")
      .delete()
      .eq("section_id", sectionId);
    if (deleteError) return { message: `Could not save embeds: ${deleteError.message}` };

    if (embeds.length > 0) {
      const { error: insertError } = await supabase.from("guest_view_embeds").insert(
        embeds.map((embed, index) => ({
          section_id: sectionId,
          provider: embed.provider,
          url: embed.url,
          caption: embed.caption || null,
          order_index: index,
        })),
      );
      if (insertError) return { message: `Could not save embeds: ${insertError.message}` };
    }
  }

  revalidatePath("/admin/guest-view");
  return { message: "Section updated." };
}

export async function deleteGuestViewSection(sectionId: string): Promise<{ message?: string }> {
  await requireAdmin();

  if (isLocalTestMode()) {
    mockDeleteGuestViewSection(sectionId);
  } else {
    const supabase = getSupabaseAdmin();
    // guest_view_embeds is ON DELETE CASCADE, so no manual cleanup needed.
    const { error } = await supabase.from("guest_view_sections").delete().eq("id", sectionId);
    if (error) return { message: `Could not delete section: ${error.message}` };
  }

  revalidatePath("/admin/guest-view");
  return {};
}

export async function moveGuestViewSection(
  sectionId: string,
  direction: "up" | "down",
): Promise<{ message?: string }> {
  await requireAdmin();

  if (isLocalTestMode()) {
    mockMoveGuestViewSection(sectionId, direction);
  } else {
    const sections = await listGuestViewSections();
    const index = sections.findIndex((section) => section.id === sectionId);
    if (index === -1) return {};
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= sections.length) return {};

    const supabase = getSupabaseAdmin();
    const current = sections[index];
    const neighbor = sections[swapIndex];
    const { error } = await supabase
      .from("guest_view_sections")
      .update({ order_index: neighbor.orderIndex })
      .eq("id", current.id);
    if (error) return { message: `Could not reorder: ${error.message}` };

    const { error: secondError } = await supabase
      .from("guest_view_sections")
      .update({ order_index: current.orderIndex })
      .eq("id", neighbor.id);
    if (secondError) return { message: `Could not reorder: ${secondError.message}` };
  }

  revalidatePath("/admin/guest-view");
  return {};
}

type BuiltinSectionType = Extract<
  GuestViewSectionType,
  "countdown" | "wedding_date" | "dietary_restrictions"
>;

function parseBuiltinSectionForm(formData: FormData) {
  return builtinSectionFormSchema.safeParse({
    ...Object.fromEntries(formData),
    visibleToRoles: parseVisibleToRoles(formData),
  });
}

async function createBuiltinSection(
  type: BuiltinSectionType,
  _prevState: GuestViewSectionActionState,
  formData: FormData,
): Promise<GuestViewSectionActionState> {
  await requireAdmin();

  const parsed = parseBuiltinSectionForm(formData);
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };

  const existing = await listGuestViewSections();
  const orderIndex = existing.length;

  if (isLocalTestMode()) {
    mockCreateBuiltinSection(type, parsed.data, orderIndex);
  } else {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("guest_view_sections").insert({
      type,
      title: parsed.data.title || null,
      order_index: orderIndex,
      visible_to_roles: parsed.data.visibleToRoles,
    });
    if (error) return { message: `Could not save section: ${error.message}` };
  }

  revalidatePath("/admin/guest-view");
  revalidatePath("/");
  return { message: "Section added." };
}

async function updateBuiltinSection(
  type: BuiltinSectionType,
  sectionId: string,
  _prevState: GuestViewSectionActionState,
  formData: FormData,
): Promise<GuestViewSectionActionState> {
  await requireAdmin();

  const parsed = parseBuiltinSectionForm(formData);
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };

  if (isLocalTestMode()) {
    mockUpdateBuiltinSection(sectionId, parsed.data);
  } else {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("guest_view_sections")
      .update({
        title: parsed.data.title || null,
        visible_to_roles: parsed.data.visibleToRoles,
      })
      .eq("id", sectionId)
      .eq("type", type);
    if (error) return { message: `Could not save section: ${error.message}` };
  }

  revalidatePath("/admin/guest-view");
  revalidatePath("/");
  return { message: "Section updated." };
}

export async function createCountdownSection(
  prevState: GuestViewSectionActionState,
  formData: FormData,
): Promise<GuestViewSectionActionState> {
  return createBuiltinSection("countdown", prevState, formData);
}

export async function updateCountdownSection(
  sectionId: string,
  prevState: GuestViewSectionActionState,
  formData: FormData,
): Promise<GuestViewSectionActionState> {
  return updateBuiltinSection("countdown", sectionId, prevState, formData);
}

export async function createWeddingDateSection(
  prevState: GuestViewSectionActionState,
  formData: FormData,
): Promise<GuestViewSectionActionState> {
  return createBuiltinSection("wedding_date", prevState, formData);
}

export async function updateWeddingDateSection(
  sectionId: string,
  prevState: GuestViewSectionActionState,
  formData: FormData,
): Promise<GuestViewSectionActionState> {
  return updateBuiltinSection("wedding_date", sectionId, prevState, formData);
}

export async function createDietaryRestrictionsSection(
  prevState: GuestViewSectionActionState,
  formData: FormData,
): Promise<GuestViewSectionActionState> {
  return createBuiltinSection("dietary_restrictions", prevState, formData);
}

export async function updateDietaryRestrictionsSection(
  sectionId: string,
  prevState: GuestViewSectionActionState,
  formData: FormData,
): Promise<GuestViewSectionActionState> {
  return updateBuiltinSection("dietary_restrictions", sectionId, prevState, formData);
}
