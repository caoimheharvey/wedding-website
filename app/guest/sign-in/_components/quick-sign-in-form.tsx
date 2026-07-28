"use client";

import { useActionState } from "react";
import { quickGuestSignIn, type QuickSignInState } from "@/lib/guest-auth/actions";

const initialState: QuickSignInState = undefined;

export function QuickSignInForm() {
  const [state, formAction, isPending] = useActionState(quickGuestSignIn, initialState);

  return (
    <form action={formAction} className="flex w-full flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          type="text"
          name="firstName"
          required
          autoComplete="given-name"
          placeholder="First name"
          className="input"
        />
        <input
          type="text"
          name="lastName"
          required
          autoComplete="family-name"
          placeholder="Last name"
          className="input"
        />
      </div>
      <input
        type="text"
        name="contact"
        autoComplete="email tel"
        placeholder="Email or phone (if we have it on file)"
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
