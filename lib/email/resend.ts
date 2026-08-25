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

async function sendOne(
  client: Resend,
  recipientId: string,
  to: string,
  subject: string,
  html: string,
  from: string,
): Promise<CampaignSendResult> {
  const { data, error } = await client.emails.send({ from, to, subject, html });
  if (error) return { recipientId, error: error.message };
  return { recipientId, resendId: data?.id };
}

export async function sendCampaignEmails(
  recipients: { id: string; email: string }[],
  subject: string,
  html: string,
  fromEmail: string,
): Promise<CampaignSendResult[]> {
  const client = getResendClient();
  const results: CampaignSendResult[] = [];

  for (let i = 0; i < recipients.length; i += SEND_CONCURRENCY) {
    const chunk = recipients.slice(i, i + SEND_CONCURRENCY);
    const settled = await Promise.allSettled(
      chunk.map((recipient) => sendOne(client, recipient.id, recipient.email, subject, html, fromEmail)),
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
