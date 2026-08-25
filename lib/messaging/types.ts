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

export interface MessageCampaign {
  id: string;
  subject: string;
  html: string;
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
