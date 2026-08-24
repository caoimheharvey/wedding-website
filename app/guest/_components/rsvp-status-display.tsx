import { GUEST_SITE_STRINGS } from "@/lib/guest-site/i18n";
import type { PreferredLanguage } from "@/lib/guests/types";
import type { EffectiveRsvpStatus } from "@/lib/rsvp/status";

export function RsvpStatusDisplay({
  language,
  effectiveStatus,
  effectiveDeadline,
  title,
}: {
  language: PreferredLanguage;
  effectiveStatus: EffectiveRsvpStatus;
  effectiveDeadline?: string | null;
  title?: string | null;
}) {
  const strings = GUEST_SITE_STRINGS[language];

  return (
    <div className="glass-card w-full px-4 py-4 text-left">
      <p className="text-sm font-bold text-ink">{title || strings.yourRsvp}</p>
      <p className="mt-1 text-sm text-foreground/70">
        {strings.rsvpStatusLabels[effectiveStatus]}
      </p>
      {effectiveStatus === "invited" && effectiveDeadline && (
        <p className="mt-1 text-xs text-foreground/50">
          {strings.rsvpDeadlineLabel(effectiveDeadline)}
        </p>
      )}
    </div>
  );
}
