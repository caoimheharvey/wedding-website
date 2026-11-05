"use client";

import { useState } from "react";
import {
  createChildrenSection,
  createCountdownSection,
  createDietaryRestrictionsSection,
  createPlusOneSection,
  createWeddingDateSection,
  updateChildrenSection,
  updateCountdownSection,
  updateDietaryRestrictionsSection,
  updatePlusOneSection,
  updateWeddingDateSection,
} from "@/lib/guest-view/actions";
import type { GuestViewSection } from "@/lib/guest-view/types";
import { BuiltinGuestViewSectionForm } from "./builtin-section-form";
import { TextSectionForm } from "./text-section-form";
import { EmbedGroupForm } from "./embed-group-form";
import { ImageGroupForm } from "./image-group-form";
import { RsvpSectionForm } from "./rsvp-section-form";
import { RsvpStatusSectionForm } from "./rsvp-status-section-form";
import { ContactInfoSectionForm } from "./contact-info-section-form";
import { SectionListItem } from "./section-list-item";
import { SectionStyleForm } from "./section-style-form";

type AddingType =
  | "text"
  | "embed_group"
  | "image_group"
  | "rsvp"
  | "rsvp_status"
  | "contact_info"
  | "countdown"
  | "wedding_date"
  | "dietary_restrictions"
  | "plus_one"
  | "children"
  | null;

function sectionExists(sections: GuestViewSection[], type: GuestViewSection["type"]) {
  return sections.some((section) => section.type === type);
}

export function GuestViewManager({ sections }: { sections: GuestViewSection[] }) {
  const [addingType, setAddingType] = useState<AddingType>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [styleId, setStyleId] = useState<string | null>(null);

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
      {addingType === "countdown" && (
        <BuiltinGuestViewSectionForm
          description="Shows a live countdown to the wedding date set on the Overview page."
          titlePlaceholder='Defaults to "Countdown"'
          createAction={createCountdownSection}
          updateAction={updateCountdownSection}
          onDone={() => setAddingType(null)}
        />
      )}
      {addingType === "wedding_date" && (
        <BuiltinGuestViewSectionForm
          description="Shows the wedding date, venue, and buttons to add the event to a calendar. Set the date and location on the Overview page."
          titlePlaceholder='Defaults to "Wedding date"'
          createAction={createWeddingDateSection}
          updateAction={updateWeddingDateSection}
          onDone={() => setAddingType(null)}
        />
      )}
      {addingType === "dietary_restrictions" && (
        <BuiltinGuestViewSectionForm
          description="Lets guests record dietary requirements for themselves and anyone whose RSVP they handle."
          titlePlaceholder='Defaults to "Dietary requirements"'
          createAction={createDietaryRestrictionsSection}
          updateAction={updateDietaryRestrictionsSection}
          onDone={() => setAddingType(null)}
        />
      )}
      {addingType === "plus_one" && (
        <BuiltinGuestViewSectionForm
          description="Lets a guest add their plus-one's first and last name, once they've been granted a plus-one from the Guests tab. Only shown to guests with that granted, and only until they've added one."
          titlePlaceholder='Defaults to "Add your plus-one"'
          createAction={createPlusOneSection}
          updateAction={updatePlusOneSection}
          onDone={() => setAddingType(null)}
        />
      )}
      {addingType === "children" && (
        <BuiltinGuestViewSectionForm
          description="Lets a guest add the names of children they're bringing, once granted from the Guests tab. Only shown to guests with that granted."
          titlePlaceholder='Defaults to "Bringing children?"'
          createAction={createChildrenSection}
          updateAction={updateChildrenSection}
          onDone={() => setAddingType(null)}
        />
      )}

      {!addingType && (
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => setAddingType("text")} className="rounded-full bg-terracotta px-4 py-1.5 text-sm font-medium text-whitewash transition hover:bg-terracotta-light">
            + Text section
          </button>
          <button type="button" onClick={() => setAddingType("embed_group")} className="rounded-full bg-terracotta px-4 py-1.5 text-sm font-medium text-whitewash transition hover:bg-terracotta-light">
            + Embed section
          </button>
          <button type="button" onClick={() => setAddingType("image_group")} className="rounded-full bg-terracotta px-4 py-1.5 text-sm font-medium text-whitewash transition hover:bg-terracotta-light">
            + Image section
          </button>
          {!sectionExists(sections, "countdown") && (
            <button type="button" onClick={() => setAddingType("countdown")} className="rounded-full bg-terracotta px-4 py-1.5 text-sm font-medium text-whitewash transition hover:bg-terracotta-light">
              + Countdown
            </button>
          )}
          {!sectionExists(sections, "wedding_date") && (
            <button type="button" onClick={() => setAddingType("wedding_date")} className="rounded-full bg-terracotta px-4 py-1.5 text-sm font-medium text-whitewash transition hover:bg-terracotta-light">
              + Wedding date
            </button>
          )}
          {!sectionExists(sections, "rsvp") && (
            <button type="button" onClick={() => setAddingType("rsvp")} className="rounded-full bg-terracotta px-4 py-1.5 text-sm font-medium text-whitewash transition hover:bg-terracotta-light">
              + RSVP section
            </button>
          )}
          {!sectionExists(sections, "rsvp_status") && (
            <button type="button" onClick={() => setAddingType("rsvp_status")} className="rounded-full bg-terracotta px-4 py-1.5 text-sm font-medium text-whitewash transition hover:bg-terracotta-light">
              + RSVP status section
            </button>
          )}
          {!sectionExists(sections, "contact_info") && (
            <button type="button" onClick={() => setAddingType("contact_info")} className="rounded-full bg-terracotta px-4 py-1.5 text-sm font-medium text-whitewash transition hover:bg-terracotta-light">
              + Contact info section
            </button>
          )}
          {!sectionExists(sections, "dietary_restrictions") && (
            <button type="button" onClick={() => setAddingType("dietary_restrictions")} className="rounded-full bg-terracotta px-4 py-1.5 text-sm font-medium text-whitewash transition hover:bg-terracotta-light">
              + Dietary section
            </button>
          )}
          {!sectionExists(sections, "plus_one") && (
            <button type="button" onClick={() => setAddingType("plus_one")} className="rounded-full bg-terracotta px-4 py-1.5 text-sm font-medium text-whitewash transition hover:bg-terracotta-light">
              + Plus-one section
            </button>
          )}
          {!sectionExists(sections, "children") && (
            <button type="button" onClick={() => setAddingType("children")} className="rounded-full bg-terracotta px-4 py-1.5 text-sm font-medium text-whitewash transition hover:bg-terracotta-light">
              + Children section
            </button>
          )}
        </div>
      )}

      {sections.length === 0 ? (
        <p className="text-sm text-foreground/60">No sections yet. Add one above.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {sections.map((section, index) =>
            styleId === section.id ? (
              <SectionStyleForm
                key={section.id}
                section={section}
                onDone={() => setStyleId(null)}
              />
            ) : editingId === section.id ? (
              section.type === "text" ? (
                <TextSectionForm key={section.id} section={section} onDone={() => setEditingId(null)} />
              ) : section.type === "embed_group" ? (
                <EmbedGroupForm key={section.id} section={section} onDone={() => setEditingId(null)} />
              ) : section.type === "image_group" ? (
                <ImageGroupForm key={section.id} section={section} onDone={() => setEditingId(null)} />
              ) : section.type === "contact_info" ? (
                <ContactInfoSectionForm key={section.id} section={section} onDone={() => setEditingId(null)} />
              ) : section.type === "rsvp_status" ? (
                <RsvpStatusSectionForm key={section.id} section={section} onDone={() => setEditingId(null)} />
              ) : section.type === "countdown" ? (
                <BuiltinGuestViewSectionForm
                  key={section.id}
                  section={section}
                  description="Shows a live countdown to the wedding date set on the Overview page."
                  titlePlaceholder='Defaults to "Countdown"'
                  createAction={createCountdownSection}
                  updateAction={updateCountdownSection}
                  onDone={() => setEditingId(null)}
                />
              ) : section.type === "wedding_date" ? (
                <BuiltinGuestViewSectionForm
                  key={section.id}
                  section={section}
                  description="Shows the wedding date, venue, and calendar download buttons."
                  titlePlaceholder='Defaults to "Wedding date"'
                  createAction={createWeddingDateSection}
                  updateAction={updateWeddingDateSection}
                  onDone={() => setEditingId(null)}
                />
              ) : section.type === "dietary_restrictions" ? (
                <BuiltinGuestViewSectionForm
                  key={section.id}
                  section={section}
                  description="Lets guests record dietary requirements."
                  titlePlaceholder='Defaults to "Dietary requirements"'
                  createAction={createDietaryRestrictionsSection}
                  updateAction={updateDietaryRestrictionsSection}
                  onDone={() => setEditingId(null)}
                />
              ) : section.type === "plus_one" ? (
                <BuiltinGuestViewSectionForm
                  key={section.id}
                  section={section}
                  description="Lets a guest add their plus-one's first and last name, once granted."
                  titlePlaceholder='Defaults to "Add your plus-one"'
                  createAction={createPlusOneSection}
                  updateAction={updatePlusOneSection}
                  onDone={() => setEditingId(null)}
                />
              ) : section.type === "children" ? (
                <BuiltinGuestViewSectionForm
                  key={section.id}
                  section={section}
                  description="Lets a guest add the names of children they're bringing, once granted."
                  titlePlaceholder='Defaults to "Bringing children?"'
                  createAction={createChildrenSection}
                  updateAction={updateChildrenSection}
                  onDone={() => setEditingId(null)}
                />
              ) : (
                <RsvpSectionForm key={section.id} section={section} onDone={() => setEditingId(null)} />
              )
            ) : (
              <SectionListItem
                key={section.id}
                section={section}
                isFirst={index === 0}
                isLast={index === sections.length - 1}
                onEdit={() => {
                  setStyleId(null);
                  setEditingId(section.id);
                }}
                onStyle={() => {
                  setEditingId(null);
                  setStyleId(section.id);
                }}
              />
            ),
          )}
        </div>
      )}
    </div>
  );
}
