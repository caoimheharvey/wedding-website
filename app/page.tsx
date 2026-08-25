import Link from "next/link";
import type { PreferredLanguage } from "@/lib/guests/types";
import { getGuestById, listGuests, listRsvpDelegatePairs } from "@/lib/guests/queries";
import {
  rsvpDelegatesForGuest,
  rsvpSubmitteesFor,
} from "@/lib/guests/rsvp-delegates";
import { getSiteSettings } from "@/lib/rsvp/queries";
import { getEffectiveRsvpStatus } from "@/lib/rsvp/status";
import { isLocalTestMode } from "@/lib/local-test";
import { canPreviewGuestView } from "@/lib/guest-preview";
import { getGuestSession } from "@/lib/guest-auth/session";
import { signOutGuest } from "@/lib/guest-auth/actions";
import { getPreviewPersona } from "@/lib/guest-site/preview-personas";
import { plusOnePartyNames } from "@/lib/guest-site/party-names";
import { listGuestViewSections, visibleSectionsFor } from "@/lib/guest-view/queries";
import { guestNeedsContactOnboarding, guestNeedsFirstName } from "@/lib/guests/contact-info";
import { listChildrenForGuest } from "@/lib/children/queries";
import { AdminViewLink } from "./guest/_components/admin-view-link";
import { GuestSignInContent } from "./guest/_components/guest-sign-in-content";
import { ContactInfoForm } from "./guest/_components/contact-info-form";
import { GuestPageShell } from "./guest/_components/guest-page-shell";
import { GuestSiteView } from "./guest/_components/guest-site-view";
import { GuestViewSections } from "./guest/_components/guest-view-sections";
import { LanguageTabs, isPreferredLanguage } from "./guest/_components/language-tabs";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; lang?: string }>;
}) {
  const { role, lang } = await searchParams;
  const session = await getGuestSession();

  if (session) {
    const guest = await getGuestById(session.guestId);
    if (guest) {
      const [siteSettings, allSections, allGuests, delegatePairs, children] = await Promise.all([
        getSiteSettings(),
        listGuestViewSections(),
        listGuests(),
        listRsvpDelegatePairs(),
        listChildrenForGuest(guest.id),
      ]);

      const language = isPreferredLanguage(lang) ? lang : guest.preferredLanguage;
      const effectiveDeadline = guest.rsvpDeadlineOverride ?? siteSettings.defaultRsvpDeadline;
      const effectiveStatus = getEffectiveRsvpStatus(guest.rsvpStatus, effectiveDeadline);
      const sections = visibleSectionsFor(allSections, guest.partyRoles);
      const rsvpSubmittees = rsvpSubmitteesFor(guest, allGuests, delegatePairs);
      const rsvpDelegatedBy = rsvpDelegatesForGuest(guest, allGuests, delegatePairs);
      const needsContactOnboarding =
        guestNeedsContactOnboarding(guest) || guestNeedsFirstName(guest);

      return (
        <GuestPageShell backgroundImageUrl={siteSettings.backgroundImageUrl}>
          <form action={signOutGuest} className="flex w-full justify-end">
            <button
              type="submit"
              className="text-xs font-medium text-foreground/40 hover:text-aegean"
            >
              Sign out
            </button>
          </form>

          <LanguageTabs currentLanguage={language} hrefFor={(code) => `/?lang=${code}`} />

          <GuestSiteView
            greetingNames={plusOnePartyNames(guest, allGuests)}
            language={language}
            weddingDate={siteSettings.weddingDate}
            rsvpDeadline={effectiveDeadline}
          />

          {needsContactOnboarding ? (
            <ContactInfoForm
              guest={guest}
              allGuests={allGuests}
              delegatePairs={delegatePairs}
              language={language}
              onboarding
            />
          ) : (
            <GuestViewSections
              sections={sections}
              language={language}
              siteSettings={siteSettings}
              rsvp={{
                guest,
                allGuests,
                delegatePairs,
                rsvpSubmittees,
                rsvpDelegatedBy,
                deadlinePassed: effectiveStatus === "deadline_missed",
                effectiveStatus,
                effectiveDeadline,
                children,
              }}
            />
          )}
        </GuestPageShell>
      );
    }
  }

  const canPreview = await canPreviewGuestView();
  const language: PreferredLanguage = isPreferredLanguage(lang) ? lang : "en";
  const persona = role && canPreview ? getPreviewPersona(role) : null;

  if (persona) {
    const [siteSettings, allSections] = await Promise.all([
      getSiteSettings(),
      listGuestViewSections(),
    ]);
    const sections = visibleSectionsFor(allSections, persona.partyRoles);

    return (
      <GuestPageShell
        backgroundImageUrl={siteSettings.backgroundImageUrl}
        mainClassName="relative z-10 mx-auto flex min-h-screen w-full max-w-lg flex-col items-center gap-6 px-6 py-12 text-center"
      >
        <AdminViewLink />

        {isLocalTestMode() && (
          <div className="w-full rounded-lg bg-terracotta px-4 py-2 text-center text-xs font-medium text-whitewash">
            Local test mode. Real guests sign in below.
          </div>
        )}

        <div className="flex w-full items-center justify-between text-xs">
          <Link href="/admin/guest-view" className="text-aegean underline">
            ← Back to admin
          </Link>
          <span className="text-foreground/50">Previewing as {persona.label}</span>
        </div>
        <LanguageTabs
          currentLanguage={language}
          hrefFor={(code) => `/?role=${persona.role}&lang=${code}`}
        />
        <GuestSiteView
          greetingNames={[`${persona.firstName} ${persona.lastName}`]}
          language={language}
          delegateFor={persona.delegateFor}
          weddingDate={siteSettings.weddingDate}
          rsvpDeadline={siteSettings.defaultRsvpDeadline}
        />
        <GuestViewSections sections={sections} language={language} siteSettings={siteSettings} />
      </GuestPageShell>
    );
  }

  const siteSettings = await getSiteSettings();

  return (
    <GuestPageShell
      backgroundImageUrl={siteSettings.backgroundImageUrl}
      mainClassName="relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-6 text-center"
    >
      <AdminViewLink />

      {isLocalTestMode() && (
        <div className="w-full rounded-lg bg-terracotta px-4 py-2 text-center text-xs font-medium text-whitewash">
          Local test mode. Pick a role or guest to preview from the{" "}
          <Link href="/admin/guest-view" className="underline">
            admin Guest View tab
          </Link>
          .
        </div>
      )}

      {isLocalTestMode() ? (
        <>
          <h1 className="font-display text-2xl text-ink">Preview the guest view</h1>
          <p className="text-sm text-foreground/60">
            Pick a role or a specific guest to preview from the{" "}
            <Link href="/admin/guest-view" className="text-aegean underline">
              admin Guest View tab
            </Link>
            .
          </p>
        </>
      ) : (
        <GuestSignInContent language={language} />
      )}
    </GuestPageShell>
  );
}
