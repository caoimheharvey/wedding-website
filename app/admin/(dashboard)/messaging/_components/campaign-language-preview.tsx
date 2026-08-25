"use client";

import { useState } from "react";
import type { MessageCampaignContent } from "@/lib/messaging/types";

type LanguageTab = "en" | "fr" | "zh";

const LANGUAGE_TAB_LABELS: Record<LanguageTab, string> = { en: "English", fr: "French", zh: "Mandarin" };

export function CampaignLanguagePreview({ campaign }: { campaign: MessageCampaignContent }) {
  const [activeTab, setActiveTab] = useState<LanguageTab>("en");
  const contentByTab: Record<LanguageTab, { subject: string; html: string } | null> = {
    en: { subject: campaign.subjectEn, html: campaign.htmlEn },
    fr: campaign.subjectFr && campaign.htmlFr ? { subject: campaign.subjectFr, html: campaign.htmlFr } : null,
    zh: campaign.subjectZh && campaign.htmlZh ? { subject: campaign.subjectZh, html: campaign.htmlZh } : null,
  };
  const active = contentByTab[activeTab] ?? contentByTab.en!;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1 border-b border-border">
        {(Object.keys(LANGUAGE_TAB_LABELS) as LanguageTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            disabled={!contentByTab[tab]}
            className={
              tab === activeTab
                ? "border-b-2 border-aegean px-3 py-2 text-sm font-medium text-aegean"
                : "px-3 py-2 text-sm text-foreground/50 hover:text-aegean disabled:cursor-not-allowed disabled:opacity-40"
            }
          >
            {LANGUAGE_TAB_LABELS[tab]}
          </button>
        ))}
      </div>
      <p className="text-sm font-medium text-ink">{active.subject}</p>
      <div className="glass-card p-2">
        <iframe
          title="Email preview"
          srcDoc={active.html}
          sandbox="allow-same-origin"
          className="h-96 w-full rounded-md"
        />
      </div>
    </div>
  );
}
