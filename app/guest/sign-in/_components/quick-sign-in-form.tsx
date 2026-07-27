"use client";

import { useActionState } from "react";
import { quickGuestSignIn, type QuickSignInState } from "@/lib/guest-auth/actions";

const initialState: QuickSignInState = undefined;

export function QuickSignInForm() {
  const [state, formAction, isPending] = useActionState(quickGuestSignIn, initialState);

  return (
    <form action={formAction} className="flex w-full flex-col gap-3">
      <input
        type="text"
        name="name"
        required
        placeholder="Full name (e.g. Jane Doe)"
        className="input"
      />
      <input
        type="text"
        name="contact"
        required
        placeholder="Email or phone number on your invitation"
        className="input"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-full border border-aegean px-5 py-2 text-sm font-medium text-aegean transition hover:bg-aegean/10 disabled:opacity-50"
      >
        {isPending ? "Checking…" : "Continue"}
      </button>
      {state?.message && <p className="text-sm text-foreground/70">{state.message}</p>}
    </form>
  );
}
