import Link from "next/link";
import type { MessageCampaignSummary } from "@/lib/messaging/types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function MessageHistory({ campaigns }: { campaigns: MessageCampaignSummary[] }) {
  if (campaigns.length === 0) {
    return <p className="text-sm text-foreground/60">No emails sent yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {campaigns.map((campaign) => {
        const { statusCounts } = campaign;
        return (
          <Link
            key={campaign.id}
            href={`/admin/messaging/${campaign.id}`}
            className="glass-card flex flex-col gap-1 p-4 transition hover:bg-sand/40"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium text-ink">{campaign.subject}</span>
              <span className="text-xs text-foreground/50">
                {formatDate(campaign.sentAt ?? campaign.createdAt)}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-foreground/60">
              <span>{campaign.recipientCount} recipient(s)</span>
              {statusCounts.delivered > 0 && <span>{statusCounts.delivered} delivered</span>}
              {statusCounts.sent > 0 && <span>{statusCounts.sent} sent</span>}
              {statusCounts.bounced > 0 && <span>{statusCounts.bounced} bounced</span>}
              {statusCounts.failed > 0 && <span>{statusCounts.failed} failed</span>}
              {statusCounts.queued > 0 && <span>{statusCounts.queued} queued</span>}
              {statusCounts.complained > 0 && <span>{statusCounts.complained} marked as spam</span>}
              {statusCounts.delayed > 0 && <span>{statusCounts.delayed} delayed</span>}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
