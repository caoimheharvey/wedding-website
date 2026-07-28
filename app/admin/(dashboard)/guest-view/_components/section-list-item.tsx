"use client";

import { useTransition } from "react";
import { deleteGuestViewSection, moveGuestViewSection } from "@/lib/guest-view/actions";
import { WEDDING_PARTY_ROLE_LABELS } from "@/lib/guests/types";
import type { GuestViewSection } from "@/lib/guest-view/types";

export function SectionListItem({
  section,
  isFirst,
  isLast,
  onEdit,
}: {
  section: GuestViewSection;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm(`Delete this section${section.title ? ` ("${section.title}")` : ""}?`)) {
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
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-surface p-4">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-sand px-2 py-0.5 text-xs font-medium text-ink/60">
            {section.type === "text"
              ? "Text"
              : section.type === "embed_group"
                ? "Embeds"
                : section.type === "image_group"
                  ? "Images"
                  : section.type === "contact_info"
                    ? "Contact info"
                    : section.type === "rsvp_status"
                      ? "RSVP status"
                      : "RSVP"}
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
          {section.title ||
            (section.type === "rsvp"
              ? "RSVP form"
              : section.type === "rsvp_status"
                ? "RSVP status"
                : section.type === "contact_info"
                  ? "Contact info prompt"
                  : "(untitled)")}
        </p>
        <p className="mt-0.5 text-xs text-foreground/50">
          {section.type === "text"
            ? (section.body.en ?? "").slice(0, 100)
            : section.type === "embed_group"
              ? `${section.embeds.length} embed(s), ${section.columnCount ?? 1} column(s)`
              : section.type === "image_group"
                ? `${section.images.length} image(s), ${section.columnCount ?? 1} column(s)`
                : section.type === "contact_info"
                  ? "Only shown to guests with no email or phone on file."
                  : section.type === "rsvp_status"
                    ? "Shows each guest their current RSVP status and deadline."
                    : "Guests submit or update their RSVP here."}
        </p>
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
