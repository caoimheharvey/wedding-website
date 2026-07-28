import { QuickSignInForm } from "../sign-in/_components/quick-sign-in-form";

export function GuestSignInContent() {
  return (
    <>
      <p className="text-sm tracking-[0.3em] text-aegean uppercase">Guests</p>
      <h1 className="font-display text-4xl text-ink">Caoimhe &amp; Alexandre</h1>

      <div className="w-full rounded-lg border border-border bg-surface p-4 text-left">
        <p className="mb-3 text-sm text-foreground/70">
          Enter your first and last name as shown on your invitation. If we already have your email
          or phone number, enter that too — otherwise you&apos;ll be asked for contact details next.
        </p>
        <QuickSignInForm />
      </div>
    </>
  );
}
