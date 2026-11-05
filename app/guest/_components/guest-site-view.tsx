import { GUEST_SITE_STRINGS } from "@/lib/guest-site/i18n";
import { sitePhase } from "@/lib/guest-site/phase";
import { formatWeddingDate } from "@/lib/planning/countdown";
import type { PreferredLanguage } from "@/lib/guests/types";

export function GuestSiteView({
  greetingNames,
  language,
  delegateFor,
  weddingDate = null,
  rsvpDeadline = null,
  headerLabelOverrides = null,
  heroImageUrl = null,
}: {
  greetingNames: string[];
  language: PreferredLanguage;
  delegateFor?: string[];
  /** Drive the automatic header label (You're Invited / Save the Date / Please RSVP / Almost Time!). */
  weddingDate?: string | null;
  rsvpDeadline?: string | null;
  /** Admin-set override per language — used verbatim instead of the automatic label when set. */
  headerLabelOverrides?: Record<PreferredLanguage, string | null> | null;
  /** Designed banner that replaces the label and names. */
  heroImageUrl?: string | null;
}) {
  const strings = GUEST_SITE_STRINGS[language];
  const phase = sitePhase(weddingDate, rsvpDeadline);
  const formattedDeadline = rsvpDeadline ? formatWeddingDate(rsvpDeadline, language) : null;
  // An English-only override must not leak into FR/ZH — fall back to the translated automatic label.
  const headerLabel =
    headerLabelOverrides?.[language]?.trim() || strings.phaseLabel(phase, formattedDeadline);

  return (
    <>
      {heroImageUrl ? (
        <div className="section-full -mt-12">
          <h1 className="sr-only">Caoimhe &amp; Alexandre</h1>
          {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded/hosted image */}
          <img src={heroImageUrl} alt={headerLabel} className="block h-auto w-full" />
        </div>
      ) : (
        <>
          <p className="text-xs tracking-[0.35em] text-aegean uppercase">{headerLabel}</p>
          <h1 className="font-display text-xl text-ink sm:text-2xl">Caoimhe &amp; Alexandre</h1>
        </>
      )}
      <p className="text-lg text-ink">{strings.greeting(greetingNames)}</p>

      {delegateFor && delegateFor.length > 0 && (
        <p className="max-w-md text-sm text-aegean">RSVPing for: {delegateFor.join(", ")}</p>
      )}
    </>
  );
}
