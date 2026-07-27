"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isLocalTestMode } from "@/lib/local-test";
import {
  mockCreateEmbedGroupSection,
  mockCreateTextSection,
  mockDeleteGuestViewSection,
  mockMoveGuestViewSection,
  mockUpdateEmbedGroupSection,
  mockUpdateTextSection,
} from "./mock-store";
import { listGuestViewSections } from "./queries";
import { embedGroupFormSchema, embedItemSchema, textSectionFormSchema } from "./schema";

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
      title: parsed.data.title || null,
      order_index: orderIndex,
      visible_to_roles: parsed.data.visibleToRoles,
      body_en: parsed.data.bodyEn,
      body_fr: parsed.data.bodyFr || null,
      body_zh: parsed.data.bodyZh || null,
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
        title: parsed.data.title || null,
        visible_to_roles: parsed.data.visibleToRoles,
        body_en: parsed.data.bodyEn,
        body_fr: parsed.data.bodyFr || null,
        body_zh: parsed.data.bodyZh || null,
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
