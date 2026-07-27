import Link from "next/link";
import { listGuestsWithPlusOnes } from "@/lib/guests/queries";
import type { Guest } from "@/lib/guests/types";
import { getSiteSettings } from "@/lib/rsvp/queries";
import { getEffectiveRsvpStatus, type EffectiveRsvpStatus } from "@/lib/rsvp/status";
import { isLocalTestMode } from "@/lib/local-test";
import { GuestsSection } from "./_components/guests-section";

export default async function GuestsPage() {
  const [guests, siteSettings] = await Promise.all([
    listGuestsWithPlusOnes(),
    getSiteSettings(),
  ]);

  const nameById: Record<string, string> = {};
  const effectiveStatusById: Record<string, EffectiveRsvpStatus> = {};

  function record(guest: Pick<Guest, "id" | "firstName" | "lastName" | "rsvpStatus" | "rsvpDeadlineOverride">) {
    nameById[guest.id] = `${guest.firstName} ${guest.lastName}`;
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
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink">Guests</h1>
        <Link
          href="/admin/guests/new"
          className="rounded-full bg-terracotta px-4 py-2 text-sm font-medium text-whitewash transition hover:bg-terracotta-light"
        >
          Add guest
        </Link>
      </div>

      <GuestsSection
        guests={guests}
        nameById={nameById}
        effectiveStatusById={effectiveStatusById}
        defaultDeadline={siteSettings.defaultRsvpDeadline}
        showPreviewLinks={isLocalTestMode()}
      />
    </div>
  );
}
