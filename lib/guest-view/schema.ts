import * as z from "zod";
import { WEDDING_PARTY_ROLES } from "@/lib/guests/types";

const sectionMetaSchema = z.object({
  title: z.string().trim().optional(),
  visibleToRoles: z.array(z.enum(WEDDING_PARTY_ROLES)).default([]),
});

export const textSectionFormSchema = z
  .object({
    titleEn: z.string().trim().optional(),
    titleFr: z.string().trim().optional(),
    titleZh: z.string().trim().optional(),
    visibleToRoles: z.array(z.enum(WEDDING_PARTY_ROLES)).default([]),
    columnCount: z.coerce.number().int().min(1).max(4).default(1),
    bodyEn: z.string().trim().optional(),
    bodyFr: z.string().trim().optional(),
    bodyZh: z.string().trim().optional(),
    bodyEnColumns: z.array(z.string()).optional(),
    bodyFrColumns: z.array(z.string()).optional(),
    bodyZhColumns: z.array(z.string()).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.columnCount === 1) {
      if (!data.bodyEn?.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["bodyEn"],
          message: "English text is required",
        });
      }
      return;
    }

    const englishColumns = data.bodyEnColumns ?? [];
    if (!englishColumns[0]?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["bodyEn"],
        message: "Column 1 English text is required",
      });
    }
  });

export const embedItemSchema = z.object({
  provider: z.enum(["google_maps", "pinterest", "other"]),
  url: z.url({ error: "Enter a valid URL" }),
  caption: z.string().trim().optional(),
  columnIndex: z.coerce.number().int().min(0).max(3).default(0),
});

export const embedGroupFormSchema = sectionMetaSchema.extend({
  columnCount: z.coerce.number().int().min(1).max(4).default(2),
});

export const imageGroupFormSchema = sectionMetaSchema.extend({
  columnCount: z.coerce.number().int().min(1).max(4).default(2),
});

export const rsvpSectionFormSchema = sectionMetaSchema;

export const rsvpStatusSectionFormSchema = sectionMetaSchema;

export const contactInfoSectionFormSchema = sectionMetaSchema;

export const builtinSectionFormSchema = sectionMetaSchema;
