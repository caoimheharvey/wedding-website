import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isLocalTestMode } from "@/lib/local-test";
import type { WeddingPartyRole } from "@/lib/guests/types";
import { mockListGuestViewSections } from "./mock-store";
import type { EmbedProvider, GuestViewImage, GuestViewSection } from "./types";

function parseBodyColumns(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const columns = value.map((entry) => (typeof entry === "string" ? entry : String(entry ?? "")));
  return columns.length > 0 ? columns : null;
}

interface SectionRow {
  id: string;
  type: GuestViewSection["type"];
  title: string | null;
  title_fr: string | null;
  title_zh: string | null;
  order_index: number;
  visible_to_roles: WeddingPartyRole[] | null;
  width: GuestViewSection["width"];
  text_align: GuestViewSection["textAlign"];
  body_en: string | null;
  body_fr: string | null;
  body_zh: string | null;
  body_en_columns: unknown;
  body_fr_columns: unknown;
  body_zh_columns: unknown;
  column_count: number | null;
  created_at: string;
  updated_at: string;
}

interface EmbedRow {
  id: string;
  section_id: string;
  provider: EmbedProvider;
  url: string;
  caption: string | null;
  order_index: number;
  column_index: number;
}

interface ImageRow {
  id: string;
  section_id: string;
  url: string;
  caption: string | null;
  order_index: number;
  column_index: number;
}

export async function listGuestViewSections(): Promise<GuestViewSection[]> {
  if (isLocalTestMode()) return mockListGuestViewSections();

  const supabase = getSupabaseAdmin();
  const [sectionsResult, embedsResult, imagesResult] = await Promise.all([
    supabase.from("guest_view_sections").select("*").order("order_index", { ascending: true }),
    supabase.from("guest_view_embeds").select("*").order("order_index", { ascending: true }),
    supabase.from("guest_view_images").select("*").order("order_index", { ascending: true }),
  ]);

  if (sectionsResult.error) {
    throw new Error(`Failed to load guest view sections: ${sectionsResult.error.message}`);
  }
  if (embedsResult.error) {
    throw new Error(`Failed to load guest view embeds: ${embedsResult.error.message}`);
  }
  if (imagesResult.error) {
    throw new Error(`Failed to load guest view images: ${imagesResult.error.message}`);
  }

  const embedsBySection = new Map<string, GuestViewSection["embeds"]>();
  for (const row of (embedsResult.data as EmbedRow[]) ?? []) {
    const list = embedsBySection.get(row.section_id) ?? [];
    list.push({
      id: row.id,
      provider: row.provider,
      url: row.url,
      caption: row.caption,
      orderIndex: row.order_index,
      columnIndex: row.column_index ?? 0,
    });
    embedsBySection.set(row.section_id, list);
  }

  const imagesBySection = new Map<string, GuestViewImage[]>();
  for (const row of (imagesResult.data as ImageRow[]) ?? []) {
    const list = imagesBySection.get(row.section_id) ?? [];
    list.push({
      id: row.id,
      url: row.url,
      caption: row.caption,
      orderIndex: row.order_index,
      columnIndex: row.column_index ?? 0,
    });
    imagesBySection.set(row.section_id, list);
  }

  return ((sectionsResult.data as SectionRow[]) ?? []).map((row) => ({
    id: row.id,
    type: row.type,
    titles: { en: row.title, fr: row.title_fr, zh: row.title_zh },
    orderIndex: row.order_index,
    visibleToRoles: row.visible_to_roles ?? [],
    width: row.width,
    textAlign: row.text_align,
    body: { en: row.body_en, fr: row.body_fr, zh: row.body_zh },
    bodyColumns: {
      en: parseBodyColumns(row.body_en_columns),
      fr: parseBodyColumns(row.body_fr_columns),
      zh: parseBodyColumns(row.body_zh_columns),
    },
    columnCount: row.column_count,
    embeds: embedsBySection.get(row.id) ?? [],
    images: imagesBySection.get(row.id) ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export function isSectionVisible(section: GuestViewSection, guestRoles: WeddingPartyRole[]): boolean {
  if (section.visibleToRoles.length === 0) return true;
  return section.visibleToRoles.some((role) => guestRoles.includes(role));
}

export function visibleSectionsFor(
  sections: GuestViewSection[],
  guestRoles: WeddingPartyRole[],
): GuestViewSection[] {
  return sections.filter((section) => isSectionVisible(section, guestRoles));
}
