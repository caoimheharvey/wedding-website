"use client";

import { useTransition } from "react";
import { deleteGuestViewSection, moveGuestViewSection } from "@/lib/guest-view/actions";
import { WEDDING_PARTY_ROLE_LABELS } from "@/lib/guests/types";
import type { GuestViewSection } from "@/lib/guest-view/types";
import { localizedSectionTitle } from "@/lib/guest-view/section-title";

function sectionTypeLabel(type: GuestViewSection["type"]): string {
  switch (type) {
    case "text":
      return "Text";
    case "embed_group":
      return "Embeds";
    case "image_group":
      return "Images";
    case "contact_info":
      return "Contact info";
    case "rsvp_status":
      return "RSVP status";
    case "countdown":
      return "Countdown";
    case "wedding_date":
      return "Wedding date";
    case "dietary_restrictions":
      return "Dietary";
    case "plus_one":
      return "Plus-one";
    case "children":
      return "Children";
    case "rsvp":
      return "RSVP";
  }
}

function sectionTypeDescription(section: GuestViewSection): string {
  switch (section.type) {
    case "text":
      return (section.body.en ?? "").slice(0, 100);
    case "embed_group":
      return `${section.embeds.length} embed(s), ${section.columnCount ?? 1} column(s)`;
    case "image_group":
      return `${section.images.length} image(s), ${section.columnCount ?? 1} column(s)`;
    case "contact_info":
      return "Guests can verify and update contact details for themselves and linked guests.";
    case "rsvp_status":
      return "Shows each guest their current RSVP status and deadline.";
    case "countdown":
      return "Live countdown to the wedding date from Overview settings.";
    case "wedding_date":
      return "Wedding date, location, and add-to-calendar buttons.";
    case "dietary_restrictions":
      return "Guests can record dietary requirements for their party.";
    case "plus_one":
      return "Guests granted a plus-one can add their first and last name.";
    case "children":
      return "Guests granted children can add their names.";
    case "rsvp":
      return "Guests submit or update their RSVP here.";
  }
}

function sectionDefaultTitle(section: GuestViewSection): string | null {
  switch (section.type) {
    case "rsvp":
      return "RSVP form";
    case "rsvp_status":
      return "RSVP status";
    case "contact_info":
      return "Contact info prompt";
    case "countdown":
      return "Countdown";
    case "wedding_date":
      return "Wedding date";
    case "dietary_restrictions":
      return "Dietary requirements";
    case "plus_one":
      return "Add your plus-one";
    case "children":
      return "Bringing children?";
    default:
      return null;
  }
}

export function SectionListItem({
  section,
  isFirst,
  isLast,
  onEdit,
  onStyle,
}: {
  section: GuestViewSection;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onStyle: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  const displayTitle = localizedSectionTitle(section, "en");

  function handleDelete() {
    if (!window.confirm(`Delete this section${displayTitle ? ` ("${displayTitle}")` : ""}?`)) {
      return;
    }
    startTransition(async () => {
      await deleteGuestViewSection(section.id);
    });
  }

  function handleMove(direction: "up" | "down") {
    startTransition(async () => {
      await moveGuestViewSection(section.id, direction);
    });
  }

  return (
    <div className="flex items-start justify-between gap-3 glass-card p-4">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-sand px-2 py-0.5 text-xs font-medium text-ink/60">
            {sectionTypeLabel(section.type)}
          </span>
          {section.visibleToRoles.length > 0 ? (
            section.visibleToRoles.map((role) => (
              <span
                key={role}
                className="rounded-full bg-olive/15 px-2 py-0.5 text-xs font-medium text-olive"
              >
                {WEDDING_PARTY_ROLE_LABELS[role]}
              </span>
            ))
          ) : (
            <span className="rounded-full bg-aegean-light/15 px-2 py-0.5 text-xs font-medium text-aegean">
              Everyone
            </span>
          )}
        </div>
        <p className="mt-1 font-medium text-ink">
          {displayTitle || sectionDefaultTitle(section) || "(untitled)"}
        </p>
        <p className="mt-0.5 text-xs text-foreground/50">{sectionTypeDescription(section)}</p>
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleMove("up")}
            disabled={isFirst || isPending}
            className="text-xs text-foreground/40 hover:text-aegean disabled:opacity-30"
            aria-label="Move up"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => handleMove("down")}
            disabled={isLast || isPending}
            className="text-xs text-foreground/40 hover:text-aegean disabled:opacity-30"
            aria-label="Move down"
          >
            ↓
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onEdit}
            className="text-sm font-medium text-aegean hover:underline"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onStyle}
            className="text-sm font-medium text-aegean hover:underline"
          >
            Style
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="text-sm font-medium text-terracotta hover:underline disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
