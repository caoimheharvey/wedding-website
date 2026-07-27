import Link from "next/link";
import { listGuests } from "@/lib/guests/queries";
import { PREFERRED_LANGUAGE_LABELS } from "@/lib/guests/types";
import { isLocalTestMode } from "@/lib/local-test";

export default async function GuestSignInPage() {
  if (!isLocalTestMode()) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm tracking-[0.3em] text-aegean uppercase">Guests</p>
        <h1 className="font-display text-4xl text-ink">Caoimhe &amp; Alexandre</h1>
        <p className="max-w-sm text-foreground/70">
          Guest sign-in is coming soon. Check back closer to the wedding.
        </p>
      </main>
    );
  }

  const guests = await listGuests();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 px-6 py-12">
      <div className="rounded-lg bg-terracotta px-4 py-2 text-center text-xs font-medium text-whitewash">
        Local test mode — real guest sign-in isn&apos;t built yet
      </div>
      <h1 className="font-display text-2xl text-ink">Preview as a guest</h1>
      <p className="text-sm text-foreground/60">Pick a guest to see what they&apos;d see.</p>
      <ul className="flex flex-col gap-2">
        {guests.map((guest) => (
          <li key={guest.id}>
            <Link
              href={`/guest/${guest.id}`}
              className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3 text-sm text-ink transition hover:border-aegean"
            >
              <span>
                {guest.firstName} {guest.lastName}
              </span>
              <span className="text-xs text-foreground/50">
                {PREFERRED_LANGUAGE_LABELS[guest.preferredLanguage]}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
