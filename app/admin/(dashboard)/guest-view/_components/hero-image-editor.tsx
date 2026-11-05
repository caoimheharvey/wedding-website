"use client";

import { useActionState, useRef } from "react";
import { removeHeroImage, updateHeroImage } from "@/lib/rsvp/actions";

const initialState: { message?: string } | undefined = undefined;

export function HeroImageEditor({ imageUrl }: { imageUrl: string | null }) {
  const [state, formAction, isPending] = useActionState(updateHeroImage, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="flex flex-col gap-3 glass-card p-4">
      <div>
        <p className="text-xs font-medium tracking-wide text-foreground/50 uppercase">
          Guest site header image
        </p>
        <p className="mt-1 text-sm text-foreground/60">
          A designed banner (e.g. exported from Canva) shown full width at the top of the guest site
          in place of the label and names. Guests\u2019 greeting still appears beneath it. Leave unset to
          use the default text header.
        </p>
      </div>

      {imageUrl && (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded/hosted image */}
          <img
            src={imageUrl}
            alt="Current header image"
            className="h-20 w-32 rounded-md border border-border object-cover"
          />
          <form
            action={async () => {
              await removeHeroImage();
            }}
          >
            <button
              type="submit"
              className="text-xs font-medium text-terracotta hover:underline"
            >
              Remove image
            </button>
          </form>
        </div>
      )}

      <form
        ref={formRef}
        action={formAction}
        className="flex flex-wrap items-center gap-3"
      >
        <input
          type="file"
          name="heroImage"
          accept="image/*"
          required
          className="input w-auto"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-aegean px-4 py-1.5 text-sm font-medium text-whitewash transition hover:bg-aegean-dark disabled:opacity-50"
        >
          {isPending ? "Uploading…" : "Upload"}
        </button>
      </form>
      {state?.message && <p className="text-sm text-foreground/60">{state.message}</p>}
    </div>
  );
}
