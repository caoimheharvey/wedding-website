export type CampaignStatus = "sending" | "sent" | "failed";

export type RecipientStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "bounced"
  | "complained"
  | "failed"
  | "delayed";

export const RECIPIENT_STATUS_LABELS: Record<RecipientStatus, string> = {
  queued: "Queued",
  sent: "Sent",
  delivered: "Delivered",
  bounced: "Bounced",
  complained: "Marked as spam",
  failed: "Failed",
  delayed: "Delayed",
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
  sent: number;
  delivered: number;
  bounced: number;
  complained: number;
  failed: number;
  delayed: number;
}

export interface MessageCampaign {
  id: string;
  subject: string;
  html: string;
  fromEmail: string;
  status: CampaignStatus;
  createdAt: string;
  sentAt: string | null;
}

export interface MessageCampaignSummary extends MessageCampaign {
  recipientCount: number;
  statusCounts: RecipientStatusCounts;
}

export interface MessageCampaignDetail extends MessageCampaign {
  recipients: MessageRecipient[];
}
