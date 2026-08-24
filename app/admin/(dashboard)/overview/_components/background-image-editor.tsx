"use client";

import { useActionState, useRef } from "react";
import { removeBackgroundImage, updateBackgroundImage } from "@/lib/rsvp/actions";

const initialState: { message?: string } | undefined = undefined;

export function BackgroundImageEditor({ imageUrl }: { imageUrl: string | null }) {
  const [state, formAction, isPending] = useActionState(updateBackgroundImage, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
      <div>
        <p className="text-xs font-medium tracking-wide text-foreground/50 uppercase">
          Guest site background
        </p>
        <p className="mt-1 text-sm text-foreground/60">
          A translucent photo or pattern shown behind the guest-facing site. Leave unset for the
          default romantic pattern.
        </p>
      </div>

      {imageUrl && (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded/hosted image */}
          <img
            src={imageUrl}
            alt="Current guest site background"
            className="h-20 w-32 rounded-md border border-border object-cover"
          />
          <form
            action={async () => {
              await removeBackgroundImage();
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
          name="backgroundImage"
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
