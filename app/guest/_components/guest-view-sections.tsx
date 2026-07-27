import type { GuestViewSection } from "@/lib/guest-view/types";
import type { PreferredLanguage } from "@/lib/guests/types";

const GRID_COLS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

export function GuestViewSections({
  sections,
  language,
}: {
  sections: GuestViewSection[];
  language: PreferredLanguage;
}) {
  if (sections.length === 0) return null;

  return (
    <div className="flex w-full flex-col gap-4 text-left">
      {sections.map((section) =>
        section.type === "text" ? (
          <TextSectionView key={section.id} section={section} language={language} />
        ) : (
          <EmbedGroupView key={section.id} section={section} />
        ),
      )}
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

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      {section.title && <h2 className="mb-2 font-display text-lg text-ink">{section.title}</h2>}
      {body
        .split("\n")
        .filter(Boolean)
        .map((paragraph, index) => (
          <p key={index} className="mt-1 text-sm text-foreground/70 first:mt-0">
            {paragraph}
          </p>
        ))}
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
