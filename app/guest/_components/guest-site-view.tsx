import { GUEST_SITE_STRINGS } from "@/lib/guest-site/i18n";
import type { PreferredLanguage } from "@/lib/guests/types";
import type { EffectiveRsvpStatus } from "@/lib/rsvp/status";

export function GuestSiteView({
  greetingNames,
  language,
  effectiveStatus,
  effectiveDeadline,
  delegateFor,
}: {
  greetingNames: string[];
  language: PreferredLanguage;
  effectiveStatus: EffectiveRsvpStatus;
  effectiveDeadline?: string | null;
  delegateFor?: string[];
}) {
  const strings = GUEST_SITE_STRINGS[language];

  return (
    <>
      <p className="text-sm tracking-[0.3em] text-aegean uppercase">{strings.phaseLabel}</p>
      <h1 className="font-display text-5xl text-ink">Caoimhe &amp; Alexandre</h1>
      <p className="text-lg text-ink">{strings.greeting(greetingNames)}</p>
      <p className="max-w-md text-foreground/70">{strings.intro}</p>

      {delegateFor && delegateFor.length > 0 && (
        <p className="max-w-md text-sm text-aegean">RSVPing for: {delegateFor.join(", ")}</p>
      )}

      <div className="w-full rounded-lg border border-border bg-surface px-4 py-4 text-left">
        <p className="text-sm font-medium text-ink">{strings.yourRsvp}</p>
        <p className="mt-1 text-sm text-foreground/70">
          {strings.rsvpStatusLabels[effectiveStatus]}
        </p>
        {effectiveStatus === "invited" && effectiveDeadline && (
          <p className="mt-1 text-xs text-foreground/50">
            {strings.rsvpDeadlineLabel(effectiveDeadline)}
          </p>
        )}
      </div>
    </>
  );
}
