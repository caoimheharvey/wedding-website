import type { PreferredLanguage } from "@/lib/guests/types";

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
  email: string;
  guestName: string | null;
  /** The language variant actually sent to this recipient, snapshotted at send time. */
  language: PreferredLanguage;
  resendEmailId: string | null;
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

export interface MessageCampaign extends MessageCampaignContent {
  id: string;
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
