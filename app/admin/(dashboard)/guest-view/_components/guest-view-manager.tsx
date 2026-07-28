"use client";

import { useState } from "react";
import type { GuestViewSection } from "@/lib/guest-view/types";
import { TextSectionForm } from "./text-section-form";
import { EmbedGroupForm } from "./embed-group-form";
import { ImageGroupForm } from "./image-group-form";
import { RsvpSectionForm } from "./rsvp-section-form";
import { RsvpStatusSectionForm } from "./rsvp-status-section-form";
import { ContactInfoSectionForm } from "./contact-info-section-form";
import { SectionListItem } from "./section-list-item";

export function GuestViewManager({ sections }: { sections: GuestViewSection[] }) {
  const [addingType, setAddingType] = useState<
    "text" | "embed_group" | "image_group" | "rsvp" | "rsvp_status" | "contact_info" | null
  >(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const hasRsvpSection = sections.some((section) => section.type === "rsvp");
  const hasRsvpStatusSection = sections.some((section) => section.type === "rsvp_status");
  const hasContactInfoSection = sections.some((section) => section.type === "contact_info");

  return (
    <div className="flex flex-col gap-4">
      {addingType === "text" && <TextSectionForm onDone={() => setAddingType(null)} />}
      {addingType === "embed_group" && <EmbedGroupForm onDone={() => setAddingType(null)} />}
      {addingType === "image_group" && <ImageGroupForm onDone={() => setAddingType(null)} />}
      {addingType === "rsvp" && <RsvpSectionForm onDone={() => setAddingType(null)} />}
      {addingType === "rsvp_status" && (
        <RsvpStatusSectionForm onDone={() => setAddingType(null)} />
      )}
      {addingType === "contact_info" && (
        <ContactInfoSectionForm onDone={() => setAddingType(null)} />
      )}

      {!addingType && (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setAddingType("text")}
            className="rounded-full bg-terracotta px-4 py-1.5 text-sm font-medium text-whitewash transition hover:bg-terracotta-light"
          >
            + Text section
          </button>
          <button
            type="button"
            onClick={() => setAddingType("embed_group")}
            className="rounded-full bg-terracotta px-4 py-1.5 text-sm font-medium text-whitewash transition hover:bg-terracotta-light"
          >
            + Embed section
          </button>
          <button
            type="button"
            onClick={() => setAddingType("image_group")}
            className="rounded-full bg-terracotta px-4 py-1.5 text-sm font-medium text-whitewash transition hover:bg-terracotta-light"
          >
            + Image section
          </button>
          {!hasRsvpSection && (
            <button
              type="button"
              onClick={() => setAddingType("rsvp")}
              className="rounded-full bg-terracotta px-4 py-1.5 text-sm font-medium text-whitewash transition hover:bg-terracotta-light"
            >
              + RSVP section
            </button>
          )}
          {!hasRsvpStatusSection && (
            <button
              type="button"
              onClick={() => setAddingType("rsvp_status")}
              className="rounded-full bg-terracotta px-4 py-1.5 text-sm font-medium text-whitewash transition hover:bg-terracotta-light"
            >
              + RSVP status section
            </button>
          )}
          {!hasContactInfoSection && (
            <button
              type="button"
              onClick={() => setAddingType("contact_info")}
              className="rounded-full bg-terracotta px-4 py-1.5 text-sm font-medium text-whitewash transition hover:bg-terracotta-light"
            >
              + Contact info section
            </button>
          )}
        </div>
      )}

      {sections.length === 0 ? (
        <p className="text-sm text-foreground/60">No sections yet. Add one above.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {sections.map((section, index) =>
            editingId === section.id ? (
              section.type === "text" ? (
                <TextSectionForm
                  key={section.id}
                  section={section}
                  onDone={() => setEditingId(null)}
                />
              ) : section.type === "embed_group" ? (
                <EmbedGroupForm
                  key={section.id}
                  section={section}
                  onDone={() => setEditingId(null)}
                />
              ) : section.type === "image_group" ? (
                <ImageGroupForm
                  key={section.id}
                  section={section}
                  onDone={() => setEditingId(null)}
                />
              ) : section.type === "contact_info" ? (
                <ContactInfoSectionForm
                  key={section.id}
                  section={section}
                  onDone={() => setEditingId(null)}
                />
              ) : section.type === "rsvp_status" ? (
                <RsvpStatusSectionForm
                  key={section.id}
                  section={section}
                  onDone={() => setEditingId(null)}
                />
              ) : (
                <RsvpSectionForm
                  key={section.id}
                  section={section}
                  onDone={() => setEditingId(null)}
                />
              )
            ) : (
              <SectionListItem
                key={section.id}
                section={section}
                isFirst={index === 0}
                isLast={index === sections.length - 1}
                onEdit={() => setEditingId(section.id)}
              />
            ),
          )}
        </div>
      )}
    </div>
  );
}
