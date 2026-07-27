import Link from "next/link";
import { notFound } from "next/navigation";
import { getGuestById } from "@/lib/guests/queries";
import { getSiteSettings } from "@/lib/rsvp/queries";
import { getEffectiveRsvpStatus } from "@/lib/rsvp/status";
import { isLocalTestMode } from "@/lib/local-test";
import { GuestSiteView } from "../_components/guest-site-view";
import { LanguageTabs, isPreferredLanguage } from "../_components/language-tabs";

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

      <LanguageTabs
        currentLanguage={language}
        hrefFor={(code) => `/guest/${guest.id}?lang=${code}`}
      />

      <GuestSiteView
        firstName={guest.firstName}
        language={language}
        effectiveStatus={effectiveStatus}
        effectiveDeadline={effectiveDeadline}
      />
    </main>
  );
}
