import Link from "next/link";
import { notFound } from "next/navigation";
import { getGuestById } from "@/lib/guests/queries";
import { getSiteSettings } from "@/lib/rsvp/queries";
import { getEffectiveRsvpStatus } from "@/lib/rsvp/status";
import { GUEST_SITE_STRINGS } from "@/lib/guest-site/i18n";
import { isLocalTestMode } from "@/lib/local-test";
import { PREFERRED_LANGUAGE_LABELS, type PreferredLanguage } from "@/lib/guests/types";

const LANGUAGE_CODES = Object.keys(PREFERRED_LANGUAGE_LABELS) as PreferredLanguage[];

function isPreferredLanguage(value: string | undefined): value is PreferredLanguage {
  return !!value && (LANGUAGE_CODES as string[]).includes(value);
}

export default async function GuestPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ guestId: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  // Real guest sign-in (magic link) isn't built yet, so this route is only
  // reachable in local preview mode for now — never expose guest data
  // without real auth in production.
  if (!isLocalTestMode()) notFound();

  const { guestId } = await params;
  const { lang } = await searchParams;

  const [guest, siteSettings] = await Promise.all([getGuestById(guestId), getSiteSettings()]);
  if (!guest) notFound();

  const language = isPreferredLanguage(lang) ? lang : guest.preferredLanguage;
  const strings = GUEST_SITE_STRINGS[language];
  const effectiveDeadline = guest.rsvpDeadlineOverride ?? siteSettings.defaultRsvpDeadline;
  const effectiveStatus = getEffectiveRsvpStatus(guest.rsvpStatus, effectiveDeadline);

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex w-full flex-wrap items-center justify-between gap-2 rounded-lg bg-terracotta px-4 py-2 text-xs font-medium text-whitewash">
        <Link href="/admin/guests" className="underline">
          ← Back to admin
        </Link>
        <span>
          Local preview — viewing as {guest.firstName} {guest.lastName}.{" "}
          <Link href="/guest" className="underline">
            Switch guest
          </Link>
        </span>
      </div>

      <nav className="flex gap-3 text-sm">
        {LANGUAGE_CODES.map((code) => (
          <Link
            key={code}
            href={`/guest/${guest.id}?lang=${code}`}
            className={
              code === language
                ? "font-semibold text-aegean underline underline-offset-4"
                : "text-foreground/50 hover:text-aegean"
            }
          >
            {code.toUpperCase()}
          </Link>
        ))}
      </nav>

      <p className="text-sm tracking-[0.3em] text-aegean uppercase">{strings.phaseLabel}</p>
      <h1 className="font-display text-5xl text-ink">Caoimhe &amp; Alexandre</h1>
      <p className="text-lg text-ink">{strings.greeting(guest.firstName)}</p>
      <p className="max-w-md text-foreground/70">{strings.intro}</p>

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
    </main>
  );
}
