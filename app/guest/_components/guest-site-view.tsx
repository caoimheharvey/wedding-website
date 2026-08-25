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
}: {
  greetingNames: string[];
  language: PreferredLanguage;
  delegateFor?: string[];
  /** Drive the header label (You're Invited / Save the Date / Please RSVP / Almost Time!). */
  weddingDate?: string | null;
  rsvpDeadline?: string | null;
}) {
  const strings = GUEST_SITE_STRINGS[language];
  const phase = sitePhase(weddingDate, rsvpDeadline);
  const formattedDeadline = rsvpDeadline ? formatWeddingDate(rsvpDeadline) : null;

  return (
    <>
      <p className="text-sm tracking-[0.3em] text-aegean uppercase">
        {strings.phaseLabel(phase, formattedDeadline)}
      </p>
      <h1 className="font-display text-5xl text-ink">Caoimhe &amp; Alexandre</h1>
      <p className="text-lg text-ink">{strings.greeting(greetingNames)}</p>

      {delegateFor && delegateFor.length > 0 && (
        <p className="max-w-md text-sm text-aegean">RSVPing for: {delegateFor.join(", ")}</p>
      )}
    </>
  );
}
