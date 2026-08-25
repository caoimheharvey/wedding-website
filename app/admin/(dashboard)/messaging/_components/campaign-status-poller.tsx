"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// "scheduled" isn't polled — a scheduled send can be days away, and there's
// nothing new to fetch until it actually goes out (which its own webhook
// event, or a later page load, will surface).
const NON_POLLING_STATUSES = new Set(["scheduled", "delivered", "bounced", "complained", "failed", "canceled"]);

export function CampaignStatusPoller({ statuses }: { statuses: string[] }) {
  const router = useRouter();
  const settled = statuses.every((status) => NON_POLLING_STATUSES.has(status));

  useEffect(() => {
    if (settled) return;
    const interval = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(interval);
  }, [settled, router]);

  return null;
}
