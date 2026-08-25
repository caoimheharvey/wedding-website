import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isLocalTestMode } from "@/lib/local-test";
import { mockGetCampaignWithRecipients, mockListCampaigns, mockListRecipientsForCampaign } from "./mock-store";
import type {
  CampaignStatus,
  MessageCampaign,
  MessageCampaignDetail,
  MessageCampaignSummary,
  MessageRecipient,
  RecipientStatus,
  RecipientStatusCounts,
} from "./types";

interface CampaignRow {
  id: string;
  subject: string;
  html: string;
  from_email: string;
  status: CampaignStatus;
  created_at: string;
  sent_at: string | null;
}

interface RecipientRow {
  id: string;
  campaign_id: string;
  guest_id: string | null;
  email: string;
  guest_name: string | null;
  resend_email_id: string | null;
  status: RecipientStatus;
  status_detail: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  failed_at: string | null;
  created_at: string;
  updated_at: string;
}

function mapCampaignRow(row: CampaignRow): MessageCampaign {
  return {
    id: row.id,
    subject: row.subject,
    html: row.html,
    fromEmail: row.from_email,
    status: row.status,
    createdAt: row.created_at,
    sentAt: row.sent_at,
  };
}

function mapRecipientRow(row: RecipientRow): MessageRecipient {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    guestId: row.guest_id,
    email: row.email,
    guestName: row.guest_name,
    resendEmailId: row.resend_email_id,
    status: row.status,
    statusDetail: row.status_detail,
    sentAt: row.sent_at,
    deliveredAt: row.delivered_at,
    failedAt: row.failed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function emptyStatusCounts(): RecipientStatusCounts {
  return { queued: 0, sent: 0, delivered: 0, bounced: 0, complained: 0, failed: 0, delayed: 0 };
}

function summarize(campaign: MessageCampaign, recipients: MessageRecipient[]): MessageCampaignSummary {
  const statusCounts = emptyStatusCounts();
  for (const recipient of recipients) {
    statusCounts[recipient.status]++;
  }
  return { ...campaign, recipientCount: recipients.length, statusCounts };
}

export async function listCampaigns(): Promise<MessageCampaignSummary[]> {
  if (isLocalTestMode()) {
    return mockListCampaigns().map((campaign) =>
      summarize(campaign, mockListRecipientsForCampaign(campaign.id)),
    );
  }

  const supabase = getSupabaseAdmin();
  const { data: campaignRows, error: campaignError } = await supabase
    .from("message_campaigns")
    .select("*")
    .order("created_at", { ascending: false });
  if (campaignError) throw new Error(`Failed to load campaigns: ${campaignError.message}`);

  const { data: recipientRows, error: recipientError } = await supabase
    .from("message_recipients")
    .select("*");
  if (recipientError) throw new Error(`Failed to load recipients: ${recipientError.message}`);

  const recipientsByCampaign = new Map<string, MessageRecipient[]>();
  for (const row of recipientRows as RecipientRow[]) {
    const recipient = mapRecipientRow(row);
    const list = recipientsByCampaign.get(recipient.campaignId) ?? [];
    list.push(recipient);
    recipientsByCampaign.set(recipient.campaignId, list);
  }

  return (campaignRows as CampaignRow[]).map((row) => {
    const campaign = mapCampaignRow(row);
    return summarize(campaign, recipientsByCampaign.get(campaign.id) ?? []);
  });
}

export async function getCampaignWithRecipients(id: string): Promise<MessageCampaignDetail | null> {
  if (isLocalTestMode()) return mockGetCampaignWithRecipients(id);

  const supabase = getSupabaseAdmin();
  const { data: campaignRow, error: campaignError } = await supabase
    .from("message_campaigns")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (campaignError) throw new Error(`Failed to load campaign: ${campaignError.message}`);
  if (!campaignRow) return null;

  const { data: recipientRows, error: recipientError } = await supabase
    .from("message_recipients")
    .select("*")
    .eq("campaign_id", id)
    .order("created_at", { ascending: true });
  if (recipientError) throw new Error(`Failed to load recipients: ${recipientError.message}`);

  return {
    ...mapCampaignRow(campaignRow as CampaignRow),
    recipients: (recipientRows as RecipientRow[]).map(mapRecipientRow),
  };
}
