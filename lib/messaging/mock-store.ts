import "server-only";
import type { MessageCampaign, MessageCampaignDetail, MessageRecipient, RecipientStatus } from "./types";

/**
 * In-memory messaging data used only when LOCAL_TEST_BYPASS_AUTH is set.
 * Resets on every dev server restart — intentional, no persistence needed.
 * Sending is fully simulated here: no real Resend call is ever made in
 * local test mode, matching how every other mock-store fully replaces the
 * external side of a feature, not just the database. Scheduled sends are
 * simulated the same way — accepted immediately rather than actually
 * waiting, since there's no real delivery pipeline to wait on locally.
 */
const campaigns: MessageCampaign[] = [];
let recipients: MessageRecipient[] = [];

export function mockListCampaigns(): MessageCampaign[] {
  return [...campaigns].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function mockGetCampaignWithRecipients(id: string): MessageCampaignDetail | null {
  const campaign = campaigns.find((entry) => entry.id === id);
  if (!campaign) return null;
  return {
    ...campaign,
    recipients: recipients.filter((recipient) => recipient.campaignId === id),
  };
}

export function mockListRecipientsForCampaign(campaignId: string): MessageRecipient[] {
  return recipients.filter((recipient) => recipient.campaignId === campaignId);
}

export function mockCreateCampaignAndSend(input: {
  subject: string;
  html: string;
  fromEmail: string;
  scheduledAt: string | null;
  recipients: { guestId: string; email: string; guestName: string | null }[];
}): MessageCampaignDetail {
  const now = new Date().toISOString();
  const isScheduled = Boolean(input.scheduledAt);
  const campaign: MessageCampaign = {
    id: crypto.randomUUID(),
    subject: input.subject,
    html: input.html,
    fromEmail: input.fromEmail,
    status: isScheduled ? "scheduled" : "sent",
    createdAt: now,
    sentAt: isScheduled ? null : now,
    scheduledAt: input.scheduledAt,
  };
  campaigns.push(campaign);

  const status: RecipientStatus = isScheduled ? "scheduled" : "delivered";
  const campaignRecipients: MessageRecipient[] = input.recipients.map((recipient) => ({
    id: crypto.randomUUID(),
    campaignId: campaign.id,
    guestId: recipient.guestId,
    email: recipient.email,
    guestName: recipient.guestName,
    resendEmailId: `local-test-${crypto.randomUUID()}`,
    status,
    statusDetail: null,
    sentAt: isScheduled ? null : now,
    deliveredAt: isScheduled ? null : now,
    failedAt: null,
    createdAt: now,
    updatedAt: now,
  }));
  recipients.push(...campaignRecipients);

  return { ...campaign, recipients: campaignRecipients };
}

export function mockCancelCampaign(campaignId: string): void {
  const campaignIndex = campaigns.findIndex((campaign) => campaign.id === campaignId);
  if (campaignIndex === -1) return;
  if (campaigns[campaignIndex].status !== "scheduled") return;
  campaigns[campaignIndex] = { ...campaigns[campaignIndex], status: "canceled" };

  const now = new Date().toISOString();
  recipients = recipients.map((recipient) =>
    recipient.campaignId === campaignId && recipient.status === "scheduled"
      ? { ...recipient, status: "canceled" as RecipientStatus, updatedAt: now }
      : recipient,
  );
}
