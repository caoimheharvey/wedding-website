import Link from "next/link";
import { notFound } from "next/navigation";
import { getGuestById, listGuests, listRsvpDelegatePairs } from "@/lib/guests/queries";
import { explicitDelegateIdsForGuest } from "@/lib/guests/rsvp-delegates";
import { getSiteSettings } from "@/lib/rsvp/queries";
import { GuestForm } from "../../_components/guest-form";

export default async function EditGuestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [guest, guests, siteSettings, delegatePairs] = await Promise.all([
    getGuestById(id),
    listGuests(),
    getSiteSettings(),
    listRsvpDelegatePairs(),
  ]);

  if (!guest) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/guests" className="text-sm text-aegean hover:underline">
          ← Back to guests
        </Link>
        <h1 className="mt-2 font-display text-2xl text-ink">
          Edit {guest.firstName} {guest.lastName}
        </h1>
      </div>
      <GuestForm
        guest={guest}
        otherGuests={guests.filter((g) => g.id !== guest.id)}
        defaultRsvpDeadline={siteSettings.defaultRsvpDeadline}
        defaultRsvpDelegateIds={explicitDelegateIdsForGuest(guest.id, delegatePairs)}
      />
    </div>
  );
}
