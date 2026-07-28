import type { PreferredLanguage, WeddingPartyRole } from "@/lib/guests/types";

export type GuestViewSectionType = "text" | "embed_group" | "rsvp" | "image_group";
export type EmbedProvider = "google_maps" | "pinterest" | "other";

export interface GuestViewEmbed {
  id: string;
  provider: EmbedProvider;
  url: string;
  caption: string | null;
  orderIndex: number;
}

export interface GuestViewImage {
  id: string;
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
  /** Used by 'text' (1 = normal flow, >1 = CSS multi-column), 'embed_group', and 'image_group' sections. */
  columnCount: number | null;
  embeds: GuestViewEmbed[];
  /** Only used by 'image_group' sections. */
  images: GuestViewImage[];
  createdAt: string;
  updatedAt: string;
}
