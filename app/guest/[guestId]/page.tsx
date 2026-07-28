import Link from "next/link";
import { notFound } from "next/navigation";
import { getGuestById, listGuests } from "@/lib/guests/queries";
import { getSiteSettings } from "@/lib/rsvp/queries";
import { getEffectiveRsvpStatus } from "@/lib/rsvp/status";
import { isLocalTestMode } from "@/lib/local-test";
import { listGuestViewSections, visibleSectionsFor } from "@/lib/guest-view/queries";
import { GuestSiteView } from "../_components/guest-site-view";
import { GuestViewSections } from "../_components/guest-view-sections";
import { LanguageTabs, isPreferredLanguage } from "../_components/language-tabs";

export default async function GuestPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ guestId: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  // Real guest sign-in exists (see /guest/sign-in), but this specific route
  // previews an exact guest by id for the admin, which needs to stay
  // local-test-only — never expose guest data without real auth in production.
  if (!isLocalTestMode()) notFound();

  const { guestId } = await params;
  const { lang } = await searchParams;

  const [guest, siteSettings, allSections, allGuests] = await Promise.all([
    getGuestById(guestId),
    getSiteSettings(),
    listGuestViewSections(),
    listGuests(),
  ]);
  if (!guest) notFound();

  const language = isPreferredLanguage(lang) ? lang : guest.preferredLanguage;
  const effectiveDeadline = guest.rsvpDeadlineOverride ?? siteSettings.defaultRsvpDeadline;
  const effectiveStatus = getEffectiveRsvpStatus(guest.rsvpStatus, effectiveDeadline);
  const sections = visibleSectionsFor(allSections, guest.partyRoles);
  const delegateFor = allGuests.filter((candidate) => candidate.rsvpDelegateOf === guest.id);
  const delegateName = guest.rsvpDelegateOf
    ? allGuests.find((candidate) => candidate.id === guest.rsvpDelegateOf)
    : undefined;

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center gap-6 px-6 py-12 text-center">
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

      <GuestViewSections
        sections={sections}
        language={language}
        rsvp={{
          guest,
          delegateFor,
          deadlinePassed: effectiveStatus === "deadline_missed",
          delegateName: delegateName
            ? `${delegateName.firstName} ${delegateName.lastName}`
            : undefined,
          previewGuestId: guest.id,
        }}
      />
    </main>
  );
}
