import "server-only";
import type * as z from "zod";
import type { GuestViewSection } from "./types";
import type { embedGroupFormSchema, embedItemSchema, textSectionFormSchema } from "./schema";

/**
 * In-memory guest-view sections used only when LOCAL_TEST_BYPASS_AUTH is set.
 * Resets on every dev server restart — intentional, no persistence needed.
 */
let sections: GuestViewSection[] = seed();

function seed(): GuestViewSection[] {
  const now = new Date().toISOString();
  return [
    {
      id: crypto.randomUUID(),
      type: "text",
      title: "Getting there",
      orderIndex: 0,
      visibleToRoles: [],
      body: {
        en: "The ceremony will be held at Villa Cimbrone, with the reception following at the same venue. More travel details soon.",
        fr: null,
        zh: null,
      },
      columnCount: null,
      embeds: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      type: "text",
      title: "Maid of Honor details",
      orderIndex: 1,
      visibleToRoles: ["maid_of_honor"],
      body: {
        en: "You're on for the toast right after the cake cutting — no pressure! Rehearsal is at 4pm the day before.",
        fr: null,
        zh: null,
      },
      columnCount: null,
      embeds: [],
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
    title: data.title || null,
    orderIndex,
    visibleToRoles: data.visibleToRoles,
    body: { en: data.bodyEn, fr: data.bodyFr || null, zh: data.bodyZh || null },
    columnCount: null,
    embeds: [],
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
          title: data.title || null,
          visibleToRoles: data.visibleToRoles,
          body: { en: data.bodyEn, fr: data.bodyFr || null, zh: data.bodyZh || null },
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
    title: data.title || null,
    orderIndex,
    visibleToRoles: data.visibleToRoles,
    body: { en: null, fr: null, zh: null },
    columnCount: data.columnCount,
    embeds: embeds.map((embed, index) => ({
      id: crypto.randomUUID(),
      provider: embed.provider,
      url: embed.url,
      caption: embed.caption || null,
      orderIndex: index,
    })),
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
          title: data.title || null,
          visibleToRoles: data.visibleToRoles,
          columnCount: data.columnCount,
          embeds: embeds.map((embed, index) => ({
            id: crypto.randomUUID(),
            provider: embed.provider,
            url: embed.url,
            caption: embed.caption || null,
            orderIndex: index,
          })),
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
