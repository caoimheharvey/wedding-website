import Link from "next/link";
import { notFound } from "next/navigation";
import { getGuestById, listGuests, listRsvpDelegatePairs } from "@/lib/guests/queries";
import {
  rsvpDelegatesForGuest,
  rsvpSubmitteesFor,
} from "@/lib/guests/rsvp-delegates";
import { getSiteSettings } from "@/lib/rsvp/queries";
import { getEffectiveRsvpStatus } from "@/lib/rsvp/status";
import { canPreviewGuestView } from "@/lib/guest-preview";
import { listGuestViewSections, visibleSectionsFor } from "@/lib/guest-view/queries";
import { plusOnePartyNames } from "@/lib/guest-site/party-names";
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
  if (!(await canPreviewGuestView())) notFound();

  const { guestId } = await params;
  const { lang } = await searchParams;

  const [guest, siteSettings, allSections, allGuests, delegatePairs] = await Promise.all([
    getGuestById(guestId),
    getSiteSettings(),
    listGuestViewSections(),
    listGuests(),
    listRsvpDelegatePairs(),
  ]);
  if (!guest) notFound();

  const language = isPreferredLanguage(lang) ? lang : guest.preferredLanguage;
  const effectiveDeadline = guest.rsvpDeadlineOverride ?? siteSettings.defaultRsvpDeadline;
  const effectiveStatus = getEffectiveRsvpStatus(guest.rsvpStatus, effectiveDeadline);
  const sections = visibleSectionsFor(allSections, guest.partyRoles);
  const rsvpSubmittees = rsvpSubmitteesFor(guest, allGuests, delegatePairs);
  const rsvpDelegatedBy = rsvpDelegatesForGuest(guest, allGuests, delegatePairs);

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center gap-6 px-6 py-12 text-center">
      <div className="flex w-full flex-wrap items-center justify-between gap-2 rounded-lg bg-terracotta px-4 py-2 text-xs font-medium text-whitewash">
        <Link href="/admin/guests" className="underline">
          ← Back to admin
        </Link>
        <span>
          Preview — viewing as {guest.firstName} {guest.lastName}.{" "}
          <Link href="/admin/guest-view" className="underline">
            Switch guest
          </Link>
        </span>
      </div>

      <LanguageTabs
        currentLanguage={language}
        hrefFor={(code) => `/guest/${guest.id}?lang=${code}`}
      />

      <GuestSiteView
        greetingNames={plusOnePartyNames(guest, allGuests)}
        language={language}
      />

      <GuestViewSections
        sections={sections}
        language={language}
        rsvp={{
          guest,
          allGuests,
          delegatePairs,
          rsvpSubmittees,
          rsvpDelegatedBy,
          deadlinePassed: effectiveStatus === "deadline_missed",
          effectiveStatus,
          effectiveDeadline,
          previewGuestId: guest.id,
        }}
      />
    </main>
  );
}
