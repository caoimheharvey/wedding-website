"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const TERMINAL_STATUSES = new Set(["delivered", "bounced", "complained", "failed"]);

export function CampaignStatusPoller({ statuses }: { statuses: string[] }) {
  const router = useRouter();
  const settled = statuses.every((status) => TERMINAL_STATUSES.has(status));

  useEffect(() => {
    if (settled) return;
    const interval = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(interval);
  }, [settled, router]);

  return null;
}
