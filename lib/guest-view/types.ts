import type { PreferredLanguage, WeddingPartyRole } from "@/lib/guests/types";

export type GuestViewSectionType = "text" | "embed_group";
export type EmbedProvider = "google_maps" | "pinterest" | "other";

export interface GuestViewEmbed {
  id: string;
  provider: EmbedProvider;
  url: string;
  caption: string | null;
  orderIndex: number;
}

export interface GuestViewSection {
  id: string;
  type: GuestViewSectionType;
  title: string | null;
  orderIndex: number;
  /** Empty = visible to everyone; otherwise only guests holding one of these roles. */
  visibleToRoles: WeddingPartyRole[];
  /** Only used by 'text' sections. */
  body: Record<PreferredLanguage, string | null>;
  /** Only used by 'embed_group' sections. */
  columnCount: number | null;
  embeds: GuestViewEmbed[];
  createdAt: string;
  updatedAt: string;
}
