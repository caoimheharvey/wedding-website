import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isLocalTestMode } from "@/lib/local-test";
import type { WeddingPartyRole } from "@/lib/guests/types";
import { mockListGuestViewSections } from "./mock-store";
import type { EmbedProvider, GuestViewSection } from "./types";

interface SectionRow {
  id: string;
  type: GuestViewSection["type"];
  title: string | null;
  order_index: number;
  visible_to_roles: WeddingPartyRole[] | null;
  body_en: string | null;
  body_fr: string | null;
  body_zh: string | null;
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
}

export async function listGuestViewSections(): Promise<GuestViewSection[]> {
  if (isLocalTestMode()) return mockListGuestViewSections();

  const supabase = getSupabaseAdmin();
  const [sectionsResult, embedsResult] = await Promise.all([
    supabase.from("guest_view_sections").select("*").order("order_index", { ascending: true }),
    supabase.from("guest_view_embeds").select("*").order("order_index", { ascending: true }),
  ]);

  if (sectionsResult.error) {
    throw new Error(`Failed to load guest view sections: ${sectionsResult.error.message}`);
  }
  if (embedsResult.error) {
    throw new Error(`Failed to load guest view embeds: ${embedsResult.error.message}`);
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
    });
    embedsBySection.set(row.section_id, list);
  }

  return ((sectionsResult.data as SectionRow[]) ?? []).map((row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    orderIndex: row.order_index,
    visibleToRoles: row.visible_to_roles ?? [],
    body: { en: row.body_en, fr: row.body_fr, zh: row.body_zh },
    columnCount: row.column_count,
    embeds: embedsBySection.get(row.id) ?? [],
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
