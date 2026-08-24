import type { GuestChild } from "@/lib/children/types";
import type { GuestViewSection } from "@/lib/guest-view/types";
import type { Guest, PreferredLanguage } from "@/lib/guests/types";
import type { RsvpDelegatePair } from "@/lib/guests/rsvp-delegates";
import { guestNeedsPlusOneForm } from "@/lib/guests/plus-one";
import type { EffectiveRsvpStatus } from "@/lib/rsvp/status";
import type { SiteSettings } from "@/lib/rsvp/types";
import { localizedSectionTitle } from "@/lib/guest-view/section-title";
import { groupItemsByColumn, textSectionColumns } from "@/lib/guest-view/columns";
import { toGoogleMapsEmbedUrl } from "@/lib/guest-view/google-maps-embed";
import { GUEST_SITE_STRINGS } from "@/lib/guest-site/i18n";
import { RsvpForm } from "./rsvp-form";
import { RsvpStatusDisplay } from "./rsvp-status-display";
import { ContactInfoForm } from "./contact-info-form";
import { DietaryRestrictionsForm } from "./dietary-restrictions-form";
import { AddPlusOneForm } from "./add-plus-one-form";
import { ChildrenForm } from "./children-form";
import { PinterestBoardEmbed } from "./pinterest-board-embed";
import { CountdownSectionView, WeddingDateSectionView } from "./wedding-info-sections";

const GRID_COLS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

const TEXT_COLS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

export interface RsvpSectionContext {
  guest: Guest;
  allGuests: Guest[];
  delegatePairs: RsvpDelegatePair[];
  rsvpSubmittees: Guest[];
  rsvpDelegatedBy: Guest[];
  deadlinePassed: boolean;
  effectiveStatus: EffectiveRsvpStatus;
  effectiveDeadline?: string | null;
  /** The signed-in guest's own children, for the 'children' section type. */
  children: GuestChild[];
  /** Local-test-only: lets the admin preview route submit without a real session. */
  previewGuestId?: string;
}

export function GuestViewSections({
  sections,
  language,
  siteSettings,
  rsvp,
}: {
  sections: GuestViewSection[];
  language: PreferredLanguage;
  siteSettings: SiteSettings;
  /** Renders interactive sections at their configured position. Omit to skip them
   *  (e.g. role-only previews that have no real guest to submit for). */
  rsvp?: RsvpSectionContext;
}) {
  if (sections.length === 0) return null;

  return (
    <div className="flex w-full flex-col gap-4 text-left">
      {sections.map((section) => {
        const sectionTitle = localizedSectionTitle(section, language);
        if (section.type === "text") {
          return (
            <TextSectionView
              key={section.id}
              section={section}
              language={language}
              title={sectionTitle}
            />
          );
        }
        if (section.type === "embed_group") {
          return <EmbedGroupView key={section.id} section={section} title={sectionTitle} />;
        }
        if (section.type === "image_group") {
          return <ImageGroupView key={section.id} section={section} title={sectionTitle} />;
        }
        if (section.type === "rsvp" && rsvp) {
          return (
            <RsvpForm
              key={section.id}
              rsvpSubmittees={rsvp.rsvpSubmittees}
              rsvpDelegatedBy={rsvp.rsvpDelegatedBy}
              language={language}
              deadlinePassed={rsvp.deadlinePassed}
              previewGuestId={rsvp.previewGuestId}
              title={sectionTitle}
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
              title={sectionTitle}
            />
          );
        }
        if (section.type === "contact_info" && rsvp) {
          return (
            <ContactInfoForm
              key={section.id}
              guest={rsvp.guest}
              allGuests={rsvp.allGuests}
              delegatePairs={rsvp.delegatePairs}
              language={language}
              previewGuestId={rsvp.previewGuestId}
              title={sectionTitle}
            />
          );
        }
        if (section.type === "countdown") {
          return (
            <CountdownSectionView
              key={section.id}
              language={language}
              weddingDate={siteSettings.weddingDate}
              title={sectionTitle ?? GUEST_SITE_STRINGS[language].countdownSection.heading}
            />
          );
        }
        if (section.type === "wedding_date") {
          return (
            <WeddingDateSectionView
              key={section.id}
              language={language}
              siteSettings={siteSettings}
              title={sectionTitle ?? GUEST_SITE_STRINGS[language].weddingDateSection.heading}
            />
          );
        }
        if (section.type === "dietary_restrictions" && rsvp) {
          return (
            <DietaryRestrictionsForm
              key={section.id}
              people={rsvp.rsvpSubmittees}
              language={language}
              previewGuestId={rsvp.previewGuestId}
              title={sectionTitle}
            />
          );
        }
        if (section.type === "plus_one" && rsvp) {
          if (!guestNeedsPlusOneForm(rsvp.guest, rsvp.allGuests)) return null;
          return (
            <AddPlusOneForm
              key={section.id}
              language={language}
              previewGuestId={rsvp.previewGuestId}
              title={sectionTitle}
            />
          );
        }
        if (section.type === "children" && rsvp) {
          if (!rsvp.guest.childrenAllowed) return null;
          return (
            <ChildrenForm
              key={section.id}
              childrenList={rsvp.children}
              language={language}
              previewGuestId={rsvp.previewGuestId}
              title={sectionTitle}
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
  title,
}: {
  section: GuestViewSection;
  language: PreferredLanguage;
  title: string | null;
}) {
  const columnCount = section.columnCount ?? 1;
  const columns = textSectionColumns(section, language);
  if (columns.every((column) => !column.trim())) return null;
  const gridClass = TEXT_COLS[columnCount] ?? TEXT_COLS[1];

  return (
    <div className="glass-card p-4 text-center">
      {title && <h2 className="mb-2 font-display text-lg text-ink">{title}</h2>}
      <div className={`grid gap-4 ${gridClass}`}>
        {columns.map((columnText, columnIndex) => (
          <div key={columnIndex} className="text-left">
            {columnText
              .split("\n")
              .filter(Boolean)
              .map((paragraph, index) => (
                <p key={index} className="mt-1 text-sm text-foreground/70 first:mt-0">
                  {paragraph}
                </p>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function ImageGroupView({ section, title }: { section: GuestViewSection; title: string | null }) {
  if (section.images.length === 0) return null;
  const columnCount = section.columnCount ?? 2;
  const gridClass = GRID_COLS[columnCount] ?? GRID_COLS[2];
  const columns = groupItemsByColumn(section.images, columnCount);

  return (
    <div className="glass-card p-4">
      {title && <h2 className="mb-3 font-display text-lg text-ink">{title}</h2>}
      <div className={`grid gap-4 ${gridClass}`}>
        {columns.map((items, columnIndex) => (
          <div key={columnIndex} className="flex flex-col gap-4">
            {items.map((image) => (
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
        ))}
      </div>
    </div>
  );
}

function EmbedGroupView({ section, title }: { section: GuestViewSection; title: string | null }) {
  if (section.embeds.length === 0) return null;
  const columnCount = section.columnCount ?? 2;
  const gridClass = GRID_COLS[columnCount] ?? GRID_COLS[2];
  const columns = groupItemsByColumn(section.embeds, columnCount);

  return (
    <div className="glass-card p-4">
      {title && <h2 className="mb-3 font-display text-lg text-ink">{title}</h2>}
      <div className={`grid gap-4 ${gridClass}`}>
        {columns.map((items, columnIndex) => (
          <div key={columnIndex} className="flex flex-col gap-4">
            {items.map((embed) => (
              <div key={embed.id} className="flex flex-col gap-2">
                {embed.provider === "pinterest" ? (
                  <PinterestBoardEmbed key={embed.url} url={embed.url} />
                ) : (
                  <iframe
                    src={
                      embed.provider === "google_maps"
                        ? toGoogleMapsEmbedUrl(embed.url)
                        : embed.url
                    }
                    className="h-52 w-full rounded-md border border-border"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                )}
                {embed.caption && <p className="text-xs text-foreground/60">{embed.caption}</p>}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
