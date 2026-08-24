import "server-only";
import type * as z from "zod";
import type { PreferredLanguage } from "@/lib/guests/types";
import type { GuestViewImage, GuestViewSection } from "./types";
import type {
  contactInfoSectionFormSchema,
  embedGroupFormSchema,
  embedItemSchema,
  imageGroupFormSchema,
  rsvpSectionFormSchema,
  rsvpStatusSectionFormSchema,
  textSectionFormSchema,
  builtinSectionFormSchema,
} from "./schema";
import { textSectionMockBody } from "./text-section-persist";
import type { GuestViewSectionType } from "./types";

export interface MockImageInput {
  url: string;
  caption: string;
  columnIndex: number;
}

/**
 * In-memory guest-view sections used only when LOCAL_TEST_BYPASS_AUTH is set.
 * Resets on every dev server restart — intentional, no persistence needed.
 */
const emptyLocalizedBody = {
  body: { en: null, fr: null, zh: null },
  bodyColumns: { en: null, fr: null, zh: null },
} as const;

let sections: GuestViewSection[] = seed();

function englishTitle(title: string | null | undefined) {
  return { en: title || null, fr: null, zh: null } satisfies Record<
    PreferredLanguage,
    string | null
  >;
}

function seed(): GuestViewSection[] {
  const now = new Date().toISOString();
  return [
    {
      id: crypto.randomUUID(),
      type: "rsvp",
      titles: englishTitle(null),
      orderIndex: 0,
      visibleToRoles: [],
      width: "normal",
      textAlign: "left",
      ...emptyLocalizedBody,
      columnCount: null,
      embeds: [],
      images: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      type: "contact_info",
      titles: englishTitle(null),
      orderIndex: 1,
      visibleToRoles: [],
      width: "normal",
      textAlign: "left",
      ...emptyLocalizedBody,
      columnCount: null,
      embeds: [],
      images: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      type: "text",
      titles: englishTitle("Getting there"),
      orderIndex: 2,
      visibleToRoles: [],
      width: "normal",
      textAlign: "left",
      body: {
        en: "The ceremony will be held at Villa Cimbrone, with the reception following at the same venue. More travel details soon.",
        fr: null,
        zh: null,
      },
      bodyColumns: { en: null, fr: null, zh: null },
      columnCount: null,
      embeds: [],
      images: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      type: "text",
      titles: englishTitle("Maid of Honor details"),
      orderIndex: 3,
      visibleToRoles: ["maid_of_honor"],
      width: "normal",
      textAlign: "left",
      body: {
        en: "You're on for the toast right after the cake cutting — no pressure! Rehearsal is at 4pm the day before.",
        fr: null,
        zh: null,
      },
      bodyColumns: { en: null, fr: null, zh: null },
      columnCount: null,
      embeds: [],
      images: [],
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export function mockListGuestViewSections(): GuestViewSection[] {
  return [...sections].sort((a, b) => a.orderIndex - b.orderIndex);
}

export function mockCreateTextSection(
  data: z.infer<typeof textSectionFormSchema>,
  orderIndex: number,
): GuestViewSection {
  const now = new Date().toISOString();
  const section: GuestViewSection = {
    id: crypto.randomUUID(),
    type: "text",
    titles: {
      en: data.titleEn || null,
      fr: data.titleFr || null,
      zh: data.titleZh || null,
    },
    orderIndex,
    visibleToRoles: data.visibleToRoles,
    width: data.width,
    ...textSectionMockBody(data),
    textAlign: data.textAlign,
    columnCount: data.columnCount,
    embeds: [],
    images: [],
    createdAt: now,
    updatedAt: now,
  };
  sections.push(section);
  return section;
}

export function mockUpdateTextSection(id: string, data: z.infer<typeof textSectionFormSchema>): void {
  sections = sections.map((section) =>
    section.id === id
      ? {
          ...section,
          titles: {
      en: data.titleEn || null,
      fr: data.titleFr || null,
      zh: data.titleZh || null,
    },
          visibleToRoles: data.visibleToRoles,
          width: data.width,
          ...textSectionMockBody(data),
          textAlign: data.textAlign,
          columnCount: data.columnCount,
          updatedAt: new Date().toISOString(),
        }
      : section,
  );
}

export function mockCreateRsvpSection(
  data: z.infer<typeof rsvpSectionFormSchema>,
  orderIndex: number,
): GuestViewSection {
  const now = new Date().toISOString();
  const section: GuestViewSection = {
    id: crypto.randomUUID(),
    type: "rsvp",
    titles: englishTitle(data.title),
    orderIndex,
    visibleToRoles: data.visibleToRoles,
    width: data.width,
    textAlign: "left",
    ...emptyLocalizedBody,
    columnCount: null,
    embeds: [],
    images: [],
    createdAt: now,
    updatedAt: now,
  };
  sections.push(section);
  return section;
}

export function mockUpdateRsvpSection(id: string, data: z.infer<typeof rsvpSectionFormSchema>): void {
  sections = sections.map((section) =>
    section.id === id
      ? {
          ...section,
          titles: englishTitle(data.title),
          visibleToRoles: data.visibleToRoles,
          width: data.width,
          textAlign: "left",
          updatedAt: new Date().toISOString(),
        }
      : section,
  );
}

export function mockCreateRsvpStatusSection(
  data: z.infer<typeof rsvpStatusSectionFormSchema>,
  orderIndex: number,
): GuestViewSection {
  const now = new Date().toISOString();
  const section: GuestViewSection = {
    id: crypto.randomUUID(),
    type: "rsvp_status",
    titles: englishTitle(data.title),
    orderIndex,
    visibleToRoles: data.visibleToRoles,
    width: data.width,
    textAlign: "left",
    ...emptyLocalizedBody,
    columnCount: null,
    embeds: [],
    images: [],
    createdAt: now,
    updatedAt: now,
  };
  sections.push(section);
  return section;
}

export function mockUpdateRsvpStatusSection(
  id: string,
  data: z.infer<typeof rsvpStatusSectionFormSchema>,
): void {
  sections = sections.map((section) =>
    section.id === id
      ? {
          ...section,
          titles: englishTitle(data.title),
          visibleToRoles: data.visibleToRoles,
          width: data.width,
          textAlign: "left",
          updatedAt: new Date().toISOString(),
        }
      : section,
  );
}

export function mockCreateContactInfoSection(
  data: z.infer<typeof contactInfoSectionFormSchema>,
  orderIndex: number,
): GuestViewSection {
  const now = new Date().toISOString();
  const section: GuestViewSection = {
    id: crypto.randomUUID(),
    type: "contact_info",
    titles: englishTitle(data.title),
    orderIndex,
    visibleToRoles: data.visibleToRoles,
    width: data.width,
    textAlign: "left",
    ...emptyLocalizedBody,
    columnCount: null,
    embeds: [],
    images: [],
    createdAt: now,
    updatedAt: now,
  };
  sections.push(section);
  return section;
}

export function mockUpdateContactInfoSection(
  id: string,
  data: z.infer<typeof contactInfoSectionFormSchema>,
): void {
  sections = sections.map((section) =>
    section.id === id
      ? {
          ...section,
          titles: englishTitle(data.title),
          visibleToRoles: data.visibleToRoles,
          width: data.width,
          textAlign: "left",
          updatedAt: new Date().toISOString(),
        }
      : section,
  );
}

export function mockCreateEmbedGroupSection(
  data: z.infer<typeof embedGroupFormSchema>,
  embeds: z.infer<typeof embedItemSchema>[],
  orderIndex: number,
): GuestViewSection {
  const now = new Date().toISOString();
  const section: GuestViewSection = {
    id: crypto.randomUUID(),
    type: "embed_group",
    titles: englishTitle(data.title),
    orderIndex,
    visibleToRoles: data.visibleToRoles,
    width: data.width,
    textAlign: "left",
    ...emptyLocalizedBody,
    columnCount: data.columnCount,
    embeds: embeds.map((embed, index) => ({
      id: crypto.randomUUID(),
      provider: embed.provider,
      url: embed.url,
      caption: embed.caption || null,
      orderIndex: index,
      columnIndex: embed.columnIndex,
    })),
    images: [],
    createdAt: now,
    updatedAt: now,
  };
  sections.push(section);
  return section;
}

export function mockUpdateEmbedGroupSection(
  id: string,
  data: z.infer<typeof embedGroupFormSchema>,
  embeds: z.infer<typeof embedItemSchema>[],
): void {
  sections = sections.map((section) =>
    section.id === id
      ? {
          ...section,
          titles: englishTitle(data.title),
          visibleToRoles: data.visibleToRoles,
          width: data.width,
          textAlign: "left",
          columnCount: data.columnCount,
          embeds: embeds.map((embed, index) => ({
            id: crypto.randomUUID(),
            provider: embed.provider,
            url: embed.url,
            caption: embed.caption || null,
            orderIndex: index,
            columnIndex: embed.columnIndex,
          })),
          updatedAt: new Date().toISOString(),
        }
      : section,
  );
}

export function mockCreateImageGroupSection(
  data: z.infer<typeof imageGroupFormSchema>,
  images: MockImageInput[],
  orderIndex: number,
): GuestViewSection {
  const now = new Date().toISOString();
  const section: GuestViewSection = {
    id: crypto.randomUUID(),
    type: "image_group",
    titles: englishTitle(data.title),
    orderIndex,
    visibleToRoles: data.visibleToRoles,
    width: data.width,
    textAlign: "left",
    ...emptyLocalizedBody,
    columnCount: data.columnCount,
    embeds: [],
    images: toMockImages(images),
    createdAt: now,
    updatedAt: now,
  };
  sections.push(section);
  return section;
}

export function mockUpdateImageGroupSection(
  id: string,
  data: z.infer<typeof imageGroupFormSchema>,
  images: MockImageInput[],
): void {
  sections = sections.map((section) =>
    section.id === id
      ? {
          ...section,
          titles: englishTitle(data.title),
          visibleToRoles: data.visibleToRoles,
          width: data.width,
          textAlign: "left",
          columnCount: data.columnCount,
          images: toMockImages(images),
          updatedAt: new Date().toISOString(),
        }
      : section,
  );
}

function toMockImages(images: MockImageInput[]): GuestViewImage[] {
  return images.map((image, index) => ({
    id: crypto.randomUUID(),
    url: image.url,
    caption: image.caption || null,
    orderIndex: index,
    columnIndex: image.columnIndex,
  }));
}

export function mockCreateBuiltinSection(
  type: Extract<
    GuestViewSectionType,
    "countdown" | "wedding_date" | "dietary_restrictions" | "plus_one" | "children"
  >,
  data: z.infer<typeof builtinSectionFormSchema>,
  orderIndex: number,
): GuestViewSection {
  const now = new Date().toISOString();
  const section: GuestViewSection = {
    id: crypto.randomUUID(),
    type,
    titles: englishTitle(data.title),
    orderIndex,
    visibleToRoles: data.visibleToRoles,
    width: data.width,
    textAlign: "left",
    ...emptyLocalizedBody,
    columnCount: null,
    embeds: [],
    images: [],
    createdAt: now,
    updatedAt: now,
  };
  sections.push(section);
  return section;
}

export function mockUpdateBuiltinSection(
  id: string,
  data: z.infer<typeof builtinSectionFormSchema>,
): void {
  sections = sections.map((section) =>
    section.id === id
      ? {
          ...section,
          titles: englishTitle(data.title),
          visibleToRoles: data.visibleToRoles,
          width: data.width,
          textAlign: "left",
          updatedAt: new Date().toISOString(),
        }
      : section,
  );
}

export function mockDeleteGuestViewSection(id: string): void {
  sections = sections.filter((section) => section.id !== id);
}

export function mockMoveGuestViewSection(id: string, direction: "up" | "down"): void {
  const ordered = [...sections].sort((a, b) => a.orderIndex - b.orderIndex);
  const index = ordered.findIndex((section) => section.id === id);
  if (index === -1) return;
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= ordered.length) return;

  const a = ordered[index];
  const b = ordered[swapIndex];
  const aOrder = a.orderIndex;
  const bOrder = b.orderIndex;
  sections = sections.map((section) => {
    if (section.id === a.id) return { ...section, orderIndex: bOrder };
    if (section.id === b.id) return { ...section, orderIndex: aOrder };
    return section;
  });
}
