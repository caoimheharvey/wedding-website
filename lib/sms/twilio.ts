import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { RecipientStatus } from "@/lib/messaging/types";

const SEND_CONCURRENCY = 10;
const API_BASE = "https://api.twilio.com/2010-04-01";

/** Twilio only accepts a scheduled send 15 minutes to 35 days ahead. */
export const MIN_SCHEDULE_LEAD_MS = 15 * 60_000 + 30_000;
export const MAX_SCHEDULE_LEAD_MS = 35 * 24 * 60 * 60_000;

const STATUS_BY_TWILIO: Record<string, RecipientStatus> = {
  accepted: "queued",
  scheduled: "scheduled",
  queued: "queued",
  sending: "queued",
  sent: "sent",
  delivered: "delivered",
  undelivered: "failed",
  failed: "failed",
  canceled: "canceled",
};

export function recipientStatusFromTwilio(status: string | null | undefined): RecipientStatus | null {
  return STATUS_BY_TWILIO[(status ?? "").toLowerCase()] ?? null;
}

function credentials() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID?.trim();
  if (!accountSid || !authToken || !messagingServiceSid) {
    throw new Error(
      "Missing Twilio configuration — set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_MESSAGING_SERVICE_SID.",
    );
  }
  return { accountSid, authToken, messagingServiceSid };
}

function authHeader(accountSid: string, authToken: string): string {
  return `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`;
}

export interface SmsRecipient {
  id: string;
  phone: string;
  body: string;
}

export interface SmsSendResult {
  recipientId: string;
  sid?: string;
  error?: string;
}

async function sendOne(
  recipient: SmsRecipient,
  statusCallback: string | null,
  sendAt: string | undefined,
): Promise<SmsSendResult> {
  const { accountSid, authToken, messagingServiceSid } = credentials();
  const form = new URLSearchParams({
    To: recipient.phone,
    Body: recipient.body,
    MessagingServiceSid: messagingServiceSid,
  });
  if (statusCallback) form.set("StatusCallback", statusCallback);
  if (sendAt) {
    form.set("ScheduleType", "fixed");
    form.set("SendAt", sendAt);
  }

  const response = await fetch(`${API_BASE}/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: authHeader(accountSid, authToken),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form,
  });
  const json = (await response.json().catch(() => ({}))) as { sid?: string; message?: string };
  if (!response.ok || !json.sid) {
    return { recipientId: recipient.id, error: json.message ?? `Twilio returned ${response.status}` };
  }
  return { recipientId: recipient.id, sid: json.sid };
}

export async function sendCampaignSms(
  recipients: SmsRecipient[],
  statusCallback: string | null,
  sendAt?: string,
): Promise<SmsSendResult[]> {
  credentials(); // fail the whole send up front if Twilio isn't configured
  const results: SmsSendResult[] = [];

  for (let i = 0; i < recipients.length; i += SEND_CONCURRENCY) {
    const chunk = recipients.slice(i, i + SEND_CONCURRENCY);
    const settled = await Promise.allSettled(chunk.map((recipient) => sendOne(recipient, statusCallback, sendAt)));
    settled.forEach((outcome, index) => {
      results.push(
        outcome.status === "fulfilled"
          ? outcome.value
          : { recipientId: chunk[index].id, error: String(outcome.reason) },
      );
    });
  }
  return results;
}

export interface SmsCancelResult {
  recipientId: string;
  canceled: boolean;
  error?: string;
}

export async function cancelScheduledSms(recipients: { id: string; sid: string }[]): Promise<SmsCancelResult[]> {
  const { accountSid, authToken } = credentials();
  const settled = await Promise.allSettled(
    recipients.map(async (recipient) => {
      const response = await fetch(`${API_BASE}/Accounts/${accountSid}/Messages/${recipient.sid}.json`, {
        method: "POST",
        headers: {
          Authorization: authHeader(accountSid, authToken),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ Status: "canceled" }),
      });
      if (response.ok) return { recipientId: recipient.id, canceled: true };
      const json = (await response.json().catch(() => ({}))) as { message?: string };
      return { recipientId: recipient.id, canceled: false, error: json.message ?? `Twilio returned ${response.status}` };
    }),
  );
  return settled.map((outcome, index) =>
    outcome.status === "fulfilled"
      ? outcome.value
      : { recipientId: recipients[index].id, canceled: false, error: String(outcome.reason) },
  );
}

/**
 * Twilio signs a webhook as base64(HMAC-SHA1(authToken, url + each POST
 * param name and value, sorted by name)).
 */
export function isValidTwilioSignature(
  authToken: string,
  url: string,
  params: Record<string, string>,
  signature: string | null,
): boolean {
  if (!signature) return false;
  const payload = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], url);
  const expected = createHmac("sha1", authToken).update(payload).digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
