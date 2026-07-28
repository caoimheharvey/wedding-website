import * as z from "zod";
import { WEDDING_PARTY_ROLES } from "@/lib/guests/types";

const sectionMetaSchema = z.object({
  title: z.string().trim().optional(),
  visibleToRoles: z.array(z.enum(WEDDING_PARTY_ROLES)).default([]),
});

export const textSectionFormSchema = sectionMetaSchema.extend({
  bodyEn: z.string().trim().min(1, { error: "English text is required" }),
  bodyFr: z.string().trim().optional(),
  bodyZh: z.string().trim().optional(),
  columnCount: z.coerce.number().int().min(1).max(4).default(1),
});

export const embedGroupFormSchema = sectionMetaSchema.extend({
  columnCount: z.coerce.number().int().min(1).max(4).default(2),
});

export const imageGroupFormSchema = sectionMetaSchema.extend({
  columnCount: z.coerce.number().int().min(1).max(4).default(2),
});

export const rsvpSectionFormSchema = sectionMetaSchema;

export const embedItemSchema = z.object({
  provider: z.enum(["google_maps", "pinterest", "other"]),
  url: z.url({ error: "Enter a valid URL" }),
  caption: z.string().trim().optional(),
});
