"use client";

import { useState, useTransition } from "react";
import { updateWebsiteUrl } from "@/lib/rsvp/actions";

export function WebsiteUrlEditor({ websiteUrl }: { websiteUrl: string | null }) {
  const [value, setValue] = useState(websiteUrl ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-3 glass-card p-4">
      <div>
        <p className="text-xs font-medium tracking-wide text-foreground/50 uppercase">
          Public website (Canva)
        </p>
        <p className="mt-1 text-sm text-foreground/60">
          The address of your Canva site. Guest pages show a &quot;Back to our website&quot; link to
          it. On the Canva side, point your RSVP / guest buttons at this app&apos;s address.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="url"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="https://yourwedding.my.canva.site"
          className="input min-w-0 flex-1"
        />
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              const result = await updateWebsiteUrl(value.trim() || null);
              setMessage(result.message ?? "Saved.");
            });
          }}
          className="rounded-full bg-aegean px-4 py-1.5 text-sm font-medium text-whitewash transition hover:bg-aegean-dark disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
      </div>
      {message && <p className="text-sm text-foreground/60">{message}</p>}
    </div>
  );
}
