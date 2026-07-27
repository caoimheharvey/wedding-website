"use client";

import { useState } from "react";
import type { GuestViewSection } from "@/lib/guest-view/types";
import { TextSectionForm } from "./text-section-form";
import { EmbedGroupForm } from "./embed-group-form";
import { SectionListItem } from "./section-list-item";

export function GuestViewManager({ sections }: { sections: GuestViewSection[] }) {
  const [addingType, setAddingType] = useState<"text" | "embed_group" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      {addingType === "text" && <TextSectionForm onDone={() => setAddingType(null)} />}
      {addingType === "embed_group" && <EmbedGroupForm onDone={() => setAddingType(null)} />}

      {!addingType && (
        <div className="flex gap-3">
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
              ) : (
                <EmbedGroupForm
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
