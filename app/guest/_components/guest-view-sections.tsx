import type { GuestViewSection } from "@/lib/guest-view/types";
import type { Guest, PreferredLanguage } from "@/lib/guests/types";
import type { EffectiveRsvpStatus } from "@/lib/rsvp/status";
import { RsvpForm } from "./rsvp-form";
import { RsvpStatusDisplay } from "./rsvp-status-display";
import { ContactInfoForm } from "./contact-info-form";

const GRID_COLS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

const TEXT_COLS: Record<number, string> = {
  1: "",
  2: "sm:columns-2 sm:gap-6",
  3: "sm:columns-2 lg:columns-3 sm:gap-6",
  4: "sm:columns-2 lg:columns-4 sm:gap-6",
};

export interface RsvpSectionContext {
  guest: Guest;
  delegateFor: Guest[];
  deadlinePassed: boolean;
  delegateName?: string;
  effectiveStatus: EffectiveRsvpStatus;
  effectiveDeadline?: string | null;
  /** Local-test-only: lets the admin preview route submit without a real session. */
  previewGuestId?: string;
}

export function GuestViewSections({
  sections,
  language,
  rsvp,
}: {
  sections: GuestViewSection[];
  language: PreferredLanguage;
  /** Renders "rsvp" sections at their configured position. Omit to skip them
   *  (e.g. role-only previews that have no real guest to submit an RSVP for). */
  rsvp?: RsvpSectionContext;
}) {
  if (sections.length === 0) return null;

  return (
    <div className="flex w-full flex-col gap-4 text-left">
      {sections.map((section) => {
        if (section.type === "text") {
          return <TextSectionView key={section.id} section={section} language={language} />;
        }
        if (section.type === "embed_group") {
          return <EmbedGroupView key={section.id} section={section} />;
        }
        if (section.type === "image_group") {
          return <ImageGroupView key={section.id} section={section} />;
        }
        if (section.type === "rsvp" && rsvp) {
          return (
            <RsvpForm
              key={section.id}
              guest={rsvp.guest}
              delegateFor={rsvp.delegateFor}
              language={language}
              deadlinePassed={rsvp.deadlinePassed}
              delegateName={rsvp.delegateName}
              previewGuestId={rsvp.previewGuestId}
              title={section.title}
            />
          );
        }
        if (section.type === "rsvp_status" && rsvp) {
          return (
            <RsvpStatusDisplay
              key={section.id}
              language={language}
              effectiveStatus={rsvp.effectiveStatus}
              effectiveDeadline={rsvp.effectiveDeadline}
              title={section.title}
            />
          );
        }
        if (section.type === "contact_info" && rsvp) {
          return (
            <ContactInfoForm
              key={section.id}
              guest={rsvp.guest}
              language={language}
              previewGuestId={rsvp.previewGuestId}
              title={section.title}
            />
          );
        }
        return null;
      })}
    </div>
  );
}

function TextSectionView({
  section,
  language,
}: {
  section: GuestViewSection;
  language: PreferredLanguage;
}) {
  const body = section.body[language] || section.body.en;
  if (!body) return null;
  const columns = TEXT_COLS[section.columnCount ?? 1] ?? "";

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      {section.title && <h2 className="mb-2 font-display text-lg text-ink">{section.title}</h2>}
      <div className={columns}>
        {body
          .split("\n")
          .filter(Boolean)
          .map((paragraph, index) => (
            <p key={index} className="mt-1 text-sm text-foreground/70 first:mt-0">
              {paragraph}
            </p>
          ))}
      </div>
    </div>
  );
}

function ImageGroupView({ section }: { section: GuestViewSection }) {
  if (section.images.length === 0) return null;
  const columns = GRID_COLS[section.columnCount ?? 2] ?? GRID_COLS[2];

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      {section.title && <h2 className="mb-3 font-display text-lg text-ink">{section.title}</h2>}
      <div className={`grid gap-4 ${columns}`}>
        {section.images.map((image) => (
          <div key={image.id} className="flex flex-col gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded/hosted images, not a known-optimizable set */}
            <img
              src={image.url}
              alt={image.caption ?? ""}
              className="aspect-square w-full rounded-md border border-border object-cover"
            />
            {image.caption && <p className="text-xs text-foreground/60">{image.caption}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function EmbedGroupView({ section }: { section: GuestViewSection }) {
  if (section.embeds.length === 0) return null;
  const columns = GRID_COLS[section.columnCount ?? 2] ?? GRID_COLS[2];

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      {section.title && <h2 className="mb-3 font-display text-lg text-ink">{section.title}</h2>}
      <div className={`grid gap-4 ${columns}`}>
        {section.embeds.map((embed) => (
          <div key={embed.id} className="flex flex-col gap-2">
            {embed.provider === "pinterest" ? (
              <a
                href={embed.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-40 items-center justify-center rounded-md border border-border bg-sand/40 text-sm font-medium text-aegean hover:underline"
              >
                View on Pinterest
              </a>
            ) : (
              <iframe
                src={embed.url}
                className="h-52 w-full rounded-md border border-border"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            )}
            {embed.caption && <p className="text-xs text-foreground/60">{embed.caption}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
