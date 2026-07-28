import Link from "next/link";
import { guestDisplayName } from "@/lib/guest-site/party-names";
import type { GuestWithPlusOnes } from "@/lib/guests/types";

export function DietaryRequirementsCard({ guests }: { guests: GuestWithPlusOnes[] }) {
  const flat = guests.flatMap((guest) => [guest, ...guest.plusOnes]);
  const withDietary = flat
    .filter((guest) => guest.dietaryRestrictions)
    .sort((a, b) => guestDisplayName(a).localeCompare(guestDisplayName(b)));

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
      <header className="flex items-center justify-between gap-2">
        <h2 className="font-display text-lg text-ink">Dietary requirements</h2>
        <Link href="/admin/guests" className="text-xs font-medium text-aegean hover:underline">
          Manage guests
        </Link>
      </header>
      {withDietary.length === 0 ? (
        <p className="text-sm text-foreground/50">
          No guest has logged a dietary requirement yet — they can add one from the guest site, or
          you can enter it yourself on a guest&apos;s edit page.
        </p>
      ) : (
        <ul className="flex flex-col gap-2 text-sm">
          {withDietary.map((guest) => (
            <li key={guest.id} className="flex flex-col gap-0.5 border-b border-border/60 pb-2 last:border-0 last:pb-0">
              <span className="font-medium text-ink">{guestDisplayName(guest)}</span>
              <span className="text-terracotta">{guest.dietaryRestrictions}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
