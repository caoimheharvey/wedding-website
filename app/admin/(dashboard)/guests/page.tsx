import Link from "next/link";
import { listChildren } from "@/lib/children/queries";
import type { GuestChild } from "@/lib/children/types";
import { listGuestsWithPlusOnes } from "@/lib/guests/queries";
import type { Guest } from "@/lib/guests/types";
import { guestDisplayName } from "@/lib/guest-site/party-names";
import { getSiteSettings } from "@/lib/rsvp/queries";
import { getEffectiveRsvpStatus, type EffectiveRsvpStatus } from "@/lib/rsvp/status";
import { BulkAddGuestsForm } from "./_components/bulk-add-guests-form";
import { GuestStats } from "./_components/guest-stats";
import { GuestsSection } from "./_components/guests-section";

export default async function GuestsPage() {
  const [guests, siteSettings, children] = await Promise.all([
    listGuestsWithPlusOnes(),
    getSiteSettings(),
    listChildren(),
  ]);

  const childrenByGuestId: Record<string, GuestChild[]> = {};
  for (const child of children) {
    (childrenByGuestId[child.guestId] ??= []).push(child);
  }

  const nameById: Record<string, string> = {};
  const effectiveStatusById: Record<string, EffectiveRsvpStatus> = {};

  function record(guest: Pick<Guest, "id" | "firstName" | "lastName" | "rsvpStatus" | "rsvpDeadlineOverride">) {
    nameById[guest.id] = guestDisplayName(guest) || "Unnamed guest";
    effectiveStatusById[guest.id] = getEffectiveRsvpStatus(
      guest.rsvpStatus,
      guest.rsvpDeadlineOverride ?? siteSettings.defaultRsvpDeadline,
    );
  }

  for (const guest of guests) {
    record(guest);
    for (const plusOne of guest.plusOnes) {
      record(plusOne);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-ink">Guests</h1>
        <div className="flex flex-wrap items-center gap-2">
          <BulkAddGuestsForm />
          <Link
            href="/admin/guests/new"
            className="rounded-full bg-terracotta px-4 py-2 text-sm font-medium text-whitewash transition hover:bg-terracotta-light"
          >
            Add guest
          </Link>
        </div>
      </div>

      <GuestStats guests={guests} effectiveStatusById={effectiveStatusById} />

      <GuestsSection
        guests={guests}
        nameById={nameById}
        childrenByGuestId={childrenByGuestId}
        effectiveStatusById={effectiveStatusById}
        defaultDeadline={siteSettings.defaultRsvpDeadline}
      />
    </div>
  );
}
