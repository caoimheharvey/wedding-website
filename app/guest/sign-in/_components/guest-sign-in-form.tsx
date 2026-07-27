"use client";

import { useActionState } from "react";
import { requestGuestLoginLink, type GuestLoginRequestState } from "@/lib/guest-auth/actions";

const initialState: GuestLoginRequestState = undefined;

export function GuestSignInForm() {
  const [state, formAction, isPending] = useActionState(requestGuestLoginLink, initialState);

  return (
    <form action={formAction} className="flex w-full flex-col gap-3">
      <input
        type="email"
        name="email"
        required
        placeholder="you@example.com"
        className="input"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-aegean px-5 py-2 text-sm font-medium text-whitewash transition hover:bg-aegean-dark disabled:opacity-50"
      >
        {isPending ? "Sending…" : "Email me a sign-in link"}
      </button>
      {state?.message && <p className="text-sm text-foreground/70">{state.message}</p>}
      {state?.devLink && (
        <div className="rounded-md border border-dashed border-terracotta bg-terracotta/10 p-3 text-left text-xs text-ink">
          Local test mode — no email was sent.{" "}
          <a href={state.devLink} className="font-medium text-aegean underline">
            Click here to continue
          </a>
        </div>
      )}
    </form>
  );
}
