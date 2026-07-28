"use client";

import { useActionState, useState } from "react";
import { quickGuestSignIn, wechatGuestSignIn, type QuickSignInState } from "@/lib/guest-auth/actions";
import { GUEST_SITE_STRINGS } from "@/lib/guest-site/i18n";
import type { PreferredLanguage } from "@/lib/guests/types";

const initialState: QuickSignInState = undefined;

function NameSignInForm({ language }: { language: PreferredLanguage }) {
  const strings = GUEST_SITE_STRINGS[language].guestSignIn;
  const [state, formAction, isPending] = useActionState(quickGuestSignIn, initialState);

  return (
    <form action={formAction} className="flex w-full flex-col gap-3">
      <input type="hidden" name="language" value={language} />
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          type="text"
          name="firstName"
          required
          autoComplete="given-name"
          placeholder={strings.firstNamePlaceholder}
          className="input"
        />
        <input
          type="text"
          name="lastName"
          required
          autoComplete="family-name"
          placeholder={strings.lastNamePlaceholder}
          className="input"
        />
      </div>
      <input
        type="text"
        name="contact"
        autoComplete="email tel"
        placeholder={strings.contactPlaceholder}
        className="input"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-full border border-aegean px-5 py-2 text-sm font-medium text-aegean transition hover:bg-aegean/10 disabled:opacity-50"
      >
        {isPending ? strings.checking : strings.continue}
      </button>
      {state?.message && <p className="text-sm text-foreground/70">{state.message}</p>}
    </form>
  );
}

function WechatSignInForm({ language }: { language: PreferredLanguage }) {
  const strings = GUEST_SITE_STRINGS[language].guestSignIn;
  const [state, formAction, isPending] = useActionState(wechatGuestSignIn, initialState);

  return (
    <form action={formAction} className="flex w-full flex-col gap-3">
      <input type="hidden" name="language" value={language} />
      <input
        type="text"
        name="wechatHandle"
        required
        autoComplete="off"
        placeholder={strings.wechatPlaceholder}
        className="input"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-full border border-aegean px-5 py-2 text-sm font-medium text-aegean transition hover:bg-aegean/10 disabled:opacity-50"
      >
        {isPending ? strings.checking : strings.continue}
      </button>
      {state?.message && <p className="text-sm text-foreground/70">{state.message}</p>}
    </form>
  );
}

export function QuickSignInForm({ language }: { language: PreferredLanguage }) {
  const strings = GUEST_SITE_STRINGS[language].guestSignIn;
  const [method, setMethod] = useState<"name" | "wechat">("name");

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-center justify-center gap-2 text-xs">
        <button
          type="button"
          onClick={() => setMethod("name")}
          className={
            method === "name"
              ? "font-semibold text-aegean underline underline-offset-4"
              : "text-foreground/50 hover:text-aegean"
          }
        >
          {strings.nameTab}
        </button>
        <span className="text-foreground/30">·</span>
        <button
          type="button"
          onClick={() => setMethod("wechat")}
          className={
            method === "wechat"
              ? "font-semibold text-aegean underline underline-offset-4"
              : "text-foreground/50 hover:text-aegean"
          }
        >
          {strings.wechatTab}
        </button>
      </div>
      {method === "name" ? (
        <NameSignInForm language={language} />
      ) : (
        <WechatSignInForm language={language} />
      )}
    </div>
  );
}
