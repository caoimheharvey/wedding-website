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
  headerLabelOverride = null,
}: {
  greetingNames: string[];
  language: PreferredLanguage;
  delegateFor?: string[];
  /** Drive the automatic header label (You're Invited / Save the Date / Please RSVP / Almost Time!). */
  weddingDate?: string | null;
  rsvpDeadline?: string | null;
  /** Admin-set override — used verbatim instead of the automatic label when set. */
  headerLabelOverride?: string | null;
}) {
  const strings = GUEST_SITE_STRINGS[language];
  const phase = sitePhase(weddingDate, rsvpDeadline);
  const formattedDeadline = rsvpDeadline ? formatWeddingDate(rsvpDeadline) : null;
  const headerLabel = headerLabelOverride?.trim() || strings.phaseLabel(phase, formattedDeadline);

  return (
    <>
      <p className="text-sm tracking-[0.3em] text-aegean uppercase">{headerLabel}</p>
      <h1 className="font-display text-5xl text-ink">Caoimhe &amp; Alexandre</h1>
      <p className="text-lg text-ink">{strings.greeting(greetingNames)}</p>

      {delegateFor && delegateFor.length > 0 && (
        <p className="max-w-md text-sm text-aegean">RSVPing for: {delegateFor.join(", ")}</p>
      )}
    </>
  );
}
