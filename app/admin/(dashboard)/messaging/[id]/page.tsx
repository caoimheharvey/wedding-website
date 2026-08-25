import Link from "next/link";
import { notFound } from "next/navigation";
import { getCampaignWithRecipients } from "@/lib/messaging/queries";
import { RECIPIENT_STATUS_LABELS } from "@/lib/messaging/types";
import { PREFERRED_LANGUAGE_LABELS } from "@/lib/guests/types";
import { CampaignStatusPoller } from "../_components/campaign-status-poller";
import { CancelCampaignButton } from "../_components/cancel-campaign-button";
import { CampaignLanguagePreview } from "../_components/campaign-language-preview";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await getCampaignWithRecipients(id);
  if (!campaign) notFound();

  return (
    <div className="flex flex-col gap-6">
      <CampaignStatusPoller statuses={campaign.recipients.map((recipient) => recipient.status)} />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin/messaging" className="text-xs font-medium text-aegean hover:underline">
            ← Back to messaging
          </Link>
          <h1 className="font-display text-2xl text-ink">{campaign.subjectEn}</h1>
          <p className="mt-1 text-sm text-foreground/60">
            {campaign.status === "scheduled"
              ? `Scheduled to send ${formatDate(campaign.scheduledAt)} from ${campaign.fromEmail}`
              : campaign.status === "canceled"
                ? `Canceled — was scheduled for ${formatDate(campaign.scheduledAt)} from ${campaign.fromEmail}`
                : `Sent ${formatDate(campaign.sentAt)} from ${campaign.fromEmail}`}
          </p>
        </div>
        {campaign.status === "scheduled" && <CancelCampaignButton campaignId={campaign.id} />}
      </div>

      <CampaignLanguagePreview campaign={campaign} />

      <div className="glass-card overflow-x-auto p-4">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs tracking-wide text-foreground/50 uppercase">
            <tr>
              <th className="py-2 pr-4 font-medium">Name</th>
              <th className="py-2 pr-4 font-medium">Email</th>
              <th className="py-2 pr-4 font-medium">Language</th>
              <th className="py-2 pr-4 font-medium">Status</th>
              <th className="py-2 pr-4 font-medium">Detail</th>
            </tr>
          </thead>
          <tbody>
            {campaign.recipients.map((recipient) => (
              <tr key={recipient.id} className="border-b border-border/60 last:border-0">
                <td className="py-2 pr-4">{recipient.guestName || "—"}</td>
                <td className="py-2 pr-4 text-foreground/70">{recipient.email}</td>
                <td className="py-2 pr-4 text-foreground/70">
                  {PREFERRED_LANGUAGE_LABELS[recipient.language]}
                </td>
                <td className="py-2 pr-4">{RECIPIENT_STATUS_LABELS[recipient.status]}</td>
                <td className="py-2 pr-4 text-xs text-foreground/50">
                  {recipient.statusDetail || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
