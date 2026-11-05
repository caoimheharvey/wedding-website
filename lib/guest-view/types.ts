import type { PreferredLanguage, WeddingPartyRole } from "@/lib/guests/types";

export type GuestViewSectionType =
  | "text"
  | "embed_group"
  | "rsvp"
  | "rsvp_status"
  | "image_group"
  | "contact_info"
  | "countdown"
  | "wedding_date"
  | "dietary_restrictions"
  | "plus_one"
  | "children";
export type EmbedProvider = "google_maps" | "pinterest" | "other";
/** "wide" is only modestly wider than "normal" on larger screens — on
 *  phones (the common case) there's no room for it to differ. */
export type SectionWidth = "normal" | "wide" | "full";
/** Only meaningful for 'text' sections. */
export type SectionTextAlign = "left" | "center";

export const DECOR_POSITIONS = [
  "top-left",
  "top-center",
  "top-right",
  "center-left",
  "center-center",
  "center-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
] as const;
export type DecorPosition = (typeof DECOR_POSITIONS)[number];
export const DECOR_SIZES = ["sm", "md", "lg"] as const;
export type DecorSize = (typeof DECOR_SIZES)[number];

/** Decorative artwork (transparent PNG/SVG, e.g. florals from Canva) pinned to a section edge. */
export interface SectionDecor {
  url: string;
  position: DecorPosition;
  size: DecorSize;
}

/** Turns a section into a full-width band; all empty = the plain card look. */
export interface SectionStyle {
  bgColor: string | null;
  decor: SectionDecor[];
  fadeIn: boolean;
}

export interface GuestViewEmbed {
  id: string;
  provider: EmbedProvider;
  url: string;
  caption: string | null;
  orderIndex: number;
  columnIndex: number;
}

export interface GuestViewImage {
  id: string;
  url: string;
  caption: string | null;
  orderIndex: number;
  columnIndex: number;
}

export interface GuestViewSection {
  id: string;
  type: GuestViewSectionType;
  titles: Record<PreferredLanguage, string | null>;
  orderIndex: number;
  /** Empty = visible to everyone; otherwise only guests holding one of these roles. */
  visibleToRoles: WeddingPartyRole[];
  width: SectionWidth;
  /** Only used by 'text' sections. */
  textAlign: SectionTextAlign;
  /** Only used by 'text' sections. Legacy single-block body per language. */
  body: Record<PreferredLanguage, string | null>;
  /** Per-column text bodies when columnCount > 1. */
  bodyColumns: Record<PreferredLanguage, string[] | null>;
  /** Used by 'text' (1 = normal flow, >1 = CSS multi-column), 'embed_group', and 'image_group' sections. */
  columnCount: number | null;
  embeds: GuestViewEmbed[];
  /** Only used by 'image_group' sections. */
  images: GuestViewImage[];
  /** Optional band styling; absent = plain card. */
  style?: SectionStyle;
  createdAt: string;
  updatedAt: string;
}
