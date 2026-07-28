import { GUEST_SITE_STRINGS } from "@/lib/guest-site/i18n";
import type { PreferredLanguage } from "@/lib/guests/types";

export function GuestSiteView({
  greetingNames,
  language,
  delegateFor,
}: {
  greetingNames: string[];
  language: PreferredLanguage;
  delegateFor?: string[];
}) {
  const strings = GUEST_SITE_STRINGS[language];

  return (
    <>
      <p className="text-sm tracking-[0.3em] text-aegean uppercase">{strings.phaseLabel}</p>
      <h1 className="font-display text-5xl text-ink">Caoimhe &amp; Alexandre</h1>
      <p className="text-lg text-ink">{strings.greeting(greetingNames)}</p>

      {delegateFor && delegateFor.length > 0 && (
        <p className="max-w-md text-sm text-aegean">RSVPing for: {delegateFor.join(", ")}</p>
      )}
    </>
  );
}
