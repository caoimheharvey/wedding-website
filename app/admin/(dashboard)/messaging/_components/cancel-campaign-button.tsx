"use client";

import { useState, useTransition } from "react";
import { cancelCampaign } from "@/lib/messaging/actions";

export function CancelCampaignButton({ campaignId }: { campaignId: string }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            const result = await cancelCampaign(campaignId);
            setMessage(result.message ?? null);
          });
        }}
        className="rounded-full bg-terracotta px-4 py-1.5 text-sm font-medium text-whitewash transition hover:bg-terracotta-light disabled:opacity-50"
      >
        {isPending ? "Canceling…" : "Cancel scheduled send"}
      </button>
      {message && <p className="text-sm text-foreground/60">{message}</p>}
    </div>
  );
}
