import "server-only";
import { Resend } from "resend";

const SEND_CONCURRENCY = 10;

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY environment variable");
  }
  return new Resend(apiKey);
}

export interface CampaignSendResult {
  recipientId: string;
  resendId?: string;
  error?: string;
}

export interface CampaignRecipient {
  id: string;
  email: string;
  subject: string;
  html: string;
}

async function sendOne(
  client: Resend,
  recipient: CampaignRecipient,
  from: string,
  scheduledAt?: string,
): Promise<CampaignSendResult> {
  const { data, error } = await client.emails.send({
    from,
    to: recipient.email,
    subject: recipient.subject,
    html: recipient.html,
    scheduledAt,
  });
  if (error) return { recipientId: recipient.id, error: error.message };
  return { recipientId: recipient.id, resendId: data?.id };
}

export async function sendCampaignEmails(
  recipients: CampaignRecipient[],
  fromEmail: string,
  scheduledAt?: string,
): Promise<CampaignSendResult[]> {
  const client = getResendClient();
  const results: CampaignSendResult[] = [];

  for (let i = 0; i < recipients.length; i += SEND_CONCURRENCY) {
    const chunk = recipients.slice(i, i + SEND_CONCURRENCY);
    const settled = await Promise.allSettled(
      chunk.map((recipient) => sendOne(client, recipient, fromEmail, scheduledAt)),
    );
    settled.forEach((outcome, index) => {
      const recipientId = chunk[index].id;
      if (outcome.status === "fulfilled") {
        results.push(outcome.value);
      } else {
        results.push({ recipientId, error: String(outcome.reason) });
      }
    });
  }

  return results;
}

export interface CampaignCancelResult {
  recipientId: string;
  canceled: boolean;
  error?: string;
}

export async function cancelScheduledEmails(
  recipients: { id: string; resendEmailId: string }[],
): Promise<CampaignCancelResult[]> {
  const client = getResendClient();
  const settled = await Promise.allSettled(
    recipients.map(async (recipient) => {
      const { error } = await client.emails.cancel(recipient.resendEmailId);
      if (error) return { recipientId: recipient.id, canceled: false, error: error.message };
      return { recipientId: recipient.id, canceled: true };
    }),
  );
  return settled.map((outcome, index) =>
    outcome.status === "fulfilled"
      ? outcome.value
      : { recipientId: recipients[index].id, canceled: false, error: String(outcome.reason) },
  );
}
