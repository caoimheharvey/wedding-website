import Link from "next/link";
import { listGuests } from "@/lib/guests/queries";
import { getSiteSettings } from "@/lib/rsvp/queries";
import { GuestForm } from "../_components/guest-form";

export default async function NewGuestPage() {
  const [guests, siteSettings] = await Promise.all([listGuests(), getSiteSettings()]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/guests" className="text-sm text-aegean hover:underline">
          ← Back to guests
        </Link>
        <h1 className="mt-2 font-display text-2xl text-ink">Add guest</h1>
      </div>
      <GuestForm otherGuests={guests} defaultRsvpDeadline={siteSettings.defaultRsvpDeadline} />
    </div>
  );
}
