import "server-only";
import type { MessageCampaign, MessageCampaignDetail, MessageRecipient, RecipientStatus } from "./types";

/**
 * In-memory messaging data used only when LOCAL_TEST_BYPASS_AUTH is set.
 * Resets on every dev server restart — intentional, no persistence needed.
 * Sending is fully simulated here: no real Resend call is ever made in
 * local test mode, matching how every other mock-store fully replaces the
 * external side of a feature, not just the database.
 */
const campaigns: MessageCampaign[] = [];
const recipients: MessageRecipient[] = [];

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
  recipients: { guestId: string; email: string; guestName: string | null }[];
}): MessageCampaignDetail {
  const now = new Date().toISOString();
  const campaign: MessageCampaign = {
    id: crypto.randomUUID(),
    subject: input.subject,
    html: input.html,
    fromEmail: input.fromEmail,
    status: "sent",
    createdAt: now,
    sentAt: now,
  };
  campaigns.push(campaign);

  const campaignRecipients: MessageRecipient[] = input.recipients.map((recipient) => ({
    id: crypto.randomUUID(),
    campaignId: campaign.id,
    guestId: recipient.guestId,
    email: recipient.email,
    guestName: recipient.guestName,
    resendEmailId: `local-test-${crypto.randomUUID()}`,
    status: "delivered" as RecipientStatus,
    statusDetail: null,
    sentAt: now,
    deliveredAt: now,
    failedAt: null,
    createdAt: now,
    updatedAt: now,
  }));
  recipients.push(...campaignRecipients);

  return { ...campaign, recipients: campaignRecipients };
}
