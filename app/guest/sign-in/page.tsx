import { GuestSignInForm } from "./_components/guest-sign-in-form";
import { QuickSignInForm } from "./_components/quick-sign-in-form";

export default async function GuestSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-sm tracking-[0.3em] text-aegean uppercase">Guests</p>
      <h1 className="font-display text-4xl text-ink">Caoimhe &amp; Alexandre</h1>
      {error && (
        <p className="text-sm text-terracotta">
          That link is invalid or has expired. Request a new one below.
        </p>
      )}

      <div className="w-full rounded-lg border border-border bg-surface p-4 text-left">
        <p className="mb-3 text-sm text-foreground/70">
          Enter the name and the email or phone number your invitation was sent to — no need to
          check your email.
        </p>
        <QuickSignInForm />
      </div>

      <div className="flex w-full items-center gap-3 text-xs text-foreground/40">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="w-full text-left">
        <p className="mb-3 text-sm text-foreground/70">
          Prefer a link? We&apos;ll email you one instead — it stays signed in for 30 days.
        </p>
        <GuestSignInForm />
      </div>
    </main>
  );
}
