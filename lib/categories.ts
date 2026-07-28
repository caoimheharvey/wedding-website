/**
 * Shared between Budget and Vendors: a budget line item's category and a
 * vendor's category are the same taxonomy, so clicking through from one to
 * the other ("more detail on this budget category") is a straight lookup,
 * not a fuzzy match.
 */
export const WEDDING_CATEGORIES = [
  "venue",
  "catering",
  "flowers_decor",
  "photography",
  "videography",
  "music_entertainment",
  "officiant",
  "attire",
  "hair_makeup",
  "stationery",
  "cake_desserts",
  "favors",
  "transportation",
  "jewelry",
  "other",
] as const;

export type WeddingCategory = (typeof WEDDING_CATEGORIES)[number];

export const WEDDING_CATEGORY_LABELS: Record<WeddingCategory, string> = {
  venue: "Venue",
  catering: "Catering",
  flowers_decor: "Flowers & Decor",
  photography: "Photography",
  videography: "Videography",
  music_entertainment: "Music & Entertainment",
  officiant: "Officiant",
  attire: "Attire",
  hair_makeup: "Hair & Makeup",
  stationery: "Stationery",
  cake_desserts: "Cake & Desserts",
  favors: "Favors & Gifts",
  transportation: "Transportation & Travel",
  jewelry: "Jewelry & Rings",
  other: "Miscellaneous",
};
