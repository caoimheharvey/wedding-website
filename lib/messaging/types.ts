import type { PreferredLanguage } from "@/lib/guests/types";

export type MessageChannel = "email" | "sms";

export const CHANNEL_LABELS: Record<MessageChannel, string> = { email: "Email", sms: "Text" };

export type CampaignStatus = "sending" | "scheduled" | "sent" | "failed" | "canceled";

export type RecipientStatus =
  | "queued"
  | "scheduled"
  | "sent"
  | "delivered"
  | "bounced"
  | "complained"
  | "failed"
  | "delayed"
  | "canceled";

export const RECIPIENT_STATUS_LABELS: Record<RecipientStatus, string> = {
  queued: "Queued",
  scheduled: "Scheduled",
  sent: "Sent",
  delivered: "Delivered",
  bounced: "Bounced",
  complained: "Marked as spam",
  failed: "Failed",
  delayed: "Delayed",
  canceled: "Canceled",
};

export interface MessageRecipient {
  id: string;
  campaignId: string;
  guestId: string | null;
  /** Set for email campaigns; null for texts. */
  email: string | null;
  /** Set for text campaigns; null for emails. */
  phone: string | null;
  guestName: string | null;
  /** The language variant actually sent to this recipient, snapshotted at send time. */
  language: PreferredLanguage;
  resendEmailId: string | null;
  /** Twilio message SID for texts. */
  providerMessageId: string | null;
  status: RecipientStatus;
  statusDetail: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  failedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RecipientStatusCounts {
  queued: number;
  scheduled: number;
  sent: number;
  delivered: number;
  bounced: number;
  complained: number;
  failed: number;
  delayed: number;
  canceled: number;
}

/** One subject/HTML pair per supported guest language. English is required;
 *  French/Mandarin fall back to the English content when left blank. */
export interface MessageCampaignContent {
  subjectEn: string;
  htmlEn: string;
  subjectFr: string | null;
  htmlFr: string | null;
  subjectZh: string | null;
  htmlZh: string | null;
}

/** Plain-text bodies for a text campaign, one per supported guest language. */
export interface SmsCampaignContent {
  bodyEn: string;
  bodyFr: string | null;
  bodyZh: string | null;
}

export interface MessageCampaign extends MessageCampaignContent {
  id: string;
  channel: MessageChannel;
  bodyEn: string | null;
  bodyFr: string | null;
  bodyZh: string | null;
  /** Empty for text campaigns. */
  fromEmail: string;
  status: CampaignStatus;
  createdAt: string;
  sentAt: string | null;
  scheduledAt: string | null;
}

export interface MessageCampaignSummary extends MessageCampaign {
  recipientCount: number;
  statusCounts: RecipientStatusCounts;
}

export interface MessageCampaignDetail extends MessageCampaign {
  recipients: MessageRecipient[];
}

export function contentForLanguage(
  campaign: MessageCampaignContent,
  language: PreferredLanguage,
): { subject: string; html: string } {
  if (language === "fr" && campaign.subjectFr && campaign.htmlFr) {
    return { subject: campaign.subjectFr, html: campaign.htmlFr };
  }
  if (language === "zh" && campaign.subjectZh && campaign.htmlZh) {
    return { subject: campaign.subjectZh, html: campaign.htmlZh };
  }
  return { subject: campaign.subjectEn, html: campaign.htmlEn };
}

export function smsBodyForLanguage(campaign: SmsCampaignContent, language: PreferredLanguage): string {
  if (language === "fr" && campaign.bodyFr) return campaign.bodyFr;
  if (language === "zh" && campaign.bodyZh) return campaign.bodyZh;
  return campaign.bodyEn;
}

/** What to show as a campaign's headline: the email subject, or the start of the text. */
export function campaignTitle(campaign: Pick<MessageCampaign, "channel" | "subjectEn" | "bodyEn">): string {
  if (campaign.channel === "email") return campaign.subjectEn;
  const body = campaign.bodyEn ?? "";
  return body.length > 70 ? `${body.slice(0, 70)}…` : body;
}

/** Where a recipient was reached: their email address or phone number. */
export function recipientContact(recipient: Pick<MessageRecipient, "email" | "phone">): string {
  return recipient.email ?? recipient.phone ?? "";
}
