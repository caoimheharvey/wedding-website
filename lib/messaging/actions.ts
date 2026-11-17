"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireAdmin } from "@/lib/dal";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isLocalTestMode } from "@/lib/local-test";
import { listGuests } from "@/lib/guests/queries";
import type { PreferredLanguage } from "@/lib/guests/types";
import { guestDisplayName } from "@/lib/guest-site/party-names";
import { cancelScheduledEmails, sendCampaignEmails } from "@/lib/email/resend";
import {
  cancelScheduledSms,
  MAX_SCHEDULE_LEAD_MS,
  MIN_SCHEDULE_LEAD_MS,
  sendCampaignSms,
} from "@/lib/sms/twilio";
import { toE164 } from "@/lib/sms/phone";
import { configuredSiteOrigin } from "@/lib/site-url";
import { ensureInviteTokens, inviteOrigin, inviteUrl } from "@/lib/guest-auth/invite";
import { fillFirstNamePlaceholder, fillLinkPlaceholder, hasLinkPlaceholder } from "./personalize";
import { mockCancelCampaign, mockCreateCampaignAndSend } from "./mock-store";
import { composeMessageFormSchema, composeSmsFormSchema } from "./schema";
import {
  contentForLanguage,
  smsBodyForLanguage,
  type MessageCampaignContent,
  type SmsCampaignContent,
} from "./types";

const DEFAULT_FROM_EMAIL = "onboarding@resend.dev";

/** The origin personal links should use: the configured site, else the host this request came in on. */
async function personalLinkOrigin(): Promise<string> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const proto = requestHeaders.get("x-forwarded-proto") ?? (/^(localhost|127\.0\.0\.1)(:|$)/.test(host) ? "http" : "https");
  return inviteOrigin(`${proto}://${host}`);
}

export type ComposeMessageState =
  | { errors: Record<string, string[] | undefined>; message?: string }
  | { errors?: undefined; message?: string }
  | undefined;

export async function createAndSendCampaign(
  _prevState: ComposeMessageState,
  formData: FormData,
): Promise<ComposeMessageState> {
  await requireAdmin();
  return formData.get("channel") === "sms" ? sendSmsCampaign(formData) : sendEmailCampaign(formData);
}

async function sendEmailCampaign(formData: FormData): Promise<ComposeMessageState> {
  const parsed = composeMessageFormSchema.safeParse({
    subjectEn: formData.get("subjectEn"),
    htmlEn: formData.get("htmlEn"),
    subjectFr: formData.get("subjectFr") || undefined,
    htmlFr: formData.get("htmlFr") || undefined,
    subjectZh: formData.get("subjectZh") || undefined,
    htmlZh: formData.get("htmlZh") || undefined,
    recipientIds: formData.getAll("recipientIds"),
    scheduledAt: formData.get("scheduledAt") || undefined,
  });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };

  const { recipientIds, scheduledAt, ...fields } = parsed.data;
  const content: MessageCampaignContent = {
    subjectEn: fields.subjectEn,
    htmlEn: fields.htmlEn,
    subjectFr: fields.subjectFr || null,
    htmlFr: fields.htmlFr || null,
    subjectZh: fields.subjectZh || null,
    htmlZh: fields.htmlZh || null,
  };
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim() || DEFAULT_FROM_EMAIL;
  const scheduledAtIso = scheduledAt ? new Date(scheduledAt).toISOString() : null;

  const allGuests = await listGuests();
  const guestById = new Map(allGuests.map((guest) => [guest.id, guest]));
  const recipients = recipientIds
    .map((guestId) => guestById.get(guestId))
    .filter((guest): guest is NonNullable<typeof guest> => Boolean(guest?.email?.trim()))
    .map((guest) => ({
      guestId: guest.id,
      email: guest.email!.trim(),
      guestName: guestDisplayName(guest) || null,
      language: guest.preferredLanguage,
    }));

  if (recipients.length === 0) {
    return { message: "None of the selected recipients have an email on file." };
  }

  if (isLocalTestMode()) {
    mockCreateCampaignAndSend({
      ...content,
      channel: "email",
      bodyEn: null,
      bodyFr: null,
      bodyZh: null,
      fromEmail,
      scheduledAt: scheduledAtIso,
      recipients: recipients.map((recipient) => ({ ...recipient, phone: null })),
    });
    revalidatePath("/admin/messaging");
    return {
      message: scheduledAtIso
        ? `Scheduled to send to ${recipients.length} recipient(s).`
        : `Sent to ${recipients.length} recipient(s).`,
    };
  }

  const supabase = getSupabaseAdmin();

  const { data: campaignRow, error: campaignError } = await supabase
    .from("message_campaigns")
    .insert({
      subject_en: content.subjectEn,
      html_en: content.htmlEn,
      subject_fr: content.subjectFr,
      html_fr: content.htmlFr,
      subject_zh: content.subjectZh,
      html_zh: content.htmlZh,
      from_email: fromEmail,
      status: scheduledAtIso ? "scheduled" : "sending",
      scheduled_at: scheduledAtIso,
    })
    .select("id")
    .single();
  if (campaignError) return { message: `Could not create campaign: ${campaignError.message}` };

  const campaignId = campaignRow.id as string;

  const { data: recipientRows, error: recipientError } = await supabase
    .from("message_recipients")
    .insert(
      recipients.map((recipient) => ({
        campaign_id: campaignId,
        guest_id: recipient.guestId,
        email: recipient.email,
        guest_name: recipient.guestName,
        language: recipient.language,
        status: "queued",
      })),
    )
    .select("id, guest_id, email, language");
  if (recipientError) return { message: `Could not queue recipients: ${recipientError.message}` };

  let sendResults;
  try {
    const emailRows = recipientRows as { id: string; guest_id: string; email: string; language: "en" | "fr" | "zh" }[];
    const personalize = await personalizer(
      [content.htmlEn, content.htmlFr, content.htmlZh],
      guestById,
      emailRows.map((row) => row.guest_id),
      { html: true },
    );
    sendResults = await sendCampaignEmails(
      emailRows.map((row) => {
        const { subject, html } = contentForLanguage(content, row.language);
        return {
          id: row.id,
          email: row.email,
          subject: personalize(row.guest_id, row.language, subject, false),
          html: personalize(row.guest_id, row.language, html),
        };
      }),
      fromEmail,
      scheduledAtIso ?? undefined,
    );
  } catch (error) {
    await supabase.from("message_campaigns").update({ status: "failed" }).eq("id", campaignId);
    return {
      message: error instanceof Error ? error.message : "Could not send — check your Resend configuration.",
    };
  }

  const now = new Date().toISOString();
  let successCount = 0;
  const acceptedStatus = scheduledAtIso ? "scheduled" : "sent";
  await Promise.all(
    sendResults.map((result) => {
      if (result.resendId) {
        successCount++;
        return supabase
          .from("message_recipients")
          .update({
            status: acceptedStatus,
            resend_email_id: result.resendId,
            sent_at: scheduledAtIso ? null : now,
            updated_at: now,
          })
          .eq("id", result.recipientId);
      }
      return supabase
        .from("message_recipients")
        .update({ status: "failed", status_detail: result.error, failed_at: now, updated_at: now })
        .eq("id", result.recipientId);
    }),
  );

  await supabase
    .from("message_campaigns")
    .update({
      status: successCount > 0 ? acceptedStatus : "failed",
      sent_at: scheduledAtIso ? null : now,
    })
    .eq("id", campaignId);

  revalidatePath("/admin/messaging");
  const verb = scheduledAtIso ? "Scheduled to send" : "Sent";
  return {
    message:
      successCount === recipients.length
        ? `${verb} to ${successCount} recipient(s).`
        : `${verb} to ${successCount} of ${recipients.length} recipient(s) — check the campaign for details.`,
  };
}

/**
 * Fills {{first_name}} and {{link}} for each guest. Personal links are only
 * created when a message actually uses {{link}}.
 */
async function personalizer(
  texts: (string | null)[],
  guests: Map<string, { firstName: string | null }>,
  guestIds: string[],
  options: { html: boolean },
): Promise<(guestId: string, language: PreferredLanguage, text: string, html?: boolean) => string> {
  const usesLink = texts.some(hasLinkPlaceholder);
  const [tokens, origin] = usesLink
    ? await Promise.all([ensureInviteTokens(guestIds), personalLinkOrigin()])
    : [new Map<string, string>(), ""];
  return (guestId, language, text, html = options.html) => {
    const named = fillFirstNamePlaceholder(text, guests.get(guestId)?.firstName, { language, html });
    const token = tokens.get(guestId);
    return token ? fillLinkPlaceholder(named, inviteUrl(origin, token)) : named;
  };
}

/** Where Twilio should report delivery status: the configured site, else the host this request came in on. */
async function smsStatusCallbackUrl(): Promise<string | null> {
  const configured = configuredSiteOrigin();
  if (configured) return `${configured}/api/webhooks/twilio`;
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  if (!host || /^(localhost|127\.0\.0\.1)(:|$)/.test(host)) return null;
  return `${requestHeaders.get("x-forwarded-proto") ?? "https"}://${host}/api/webhooks/twilio`;
}

async function sendSmsCampaign(formData: FormData): Promise<ComposeMessageState> {
  const parsed = composeSmsFormSchema.safeParse({
    bodyEn: formData.get("bodyEn"),
    bodyFr: formData.get("bodyFr") || undefined,
    bodyZh: formData.get("bodyZh") || undefined,
    recipientIds: formData.getAll("recipientIds"),
    scheduledAt: formData.get("scheduledAt") || undefined,
  });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };

  const { recipientIds, scheduledAt, ...fields } = parsed.data;
  const content: SmsCampaignContent = {
    bodyEn: fields.bodyEn,
    bodyFr: fields.bodyFr || null,
    bodyZh: fields.bodyZh || null,
  };
  const scheduledAtIso = scheduledAt ? new Date(scheduledAt).toISOString() : null;

  // Twilio can only schedule a text 15 minutes to 35 days ahead. Refuse rather
  // than quietly sending a "later" message right now.
  if (scheduledAtIso) {
    const lead = Date.parse(scheduledAtIso) - Date.now();
    if (lead < MIN_SCHEDULE_LEAD_MS || lead > MAX_SCHEDULE_LEAD_MS) {
      return { message: "Texts can only be scheduled between 15 minutes and 35 days from now." };
    }
  }

  const allGuests = await listGuests();
  const guestById = new Map(allGuests.map((guest) => [guest.id, guest]));
  const recipients = recipientIds
    .map((guestId) => guestById.get(guestId))
    .filter((guest): guest is NonNullable<typeof guest> => Boolean(guest && toE164(guest.phone)))
    .map((guest) => ({
      guestId: guest.id,
      phone: toE164(guest.phone)!,
      guestName: guestDisplayName(guest) || null,
      language: guest.preferredLanguage,
    }));

  if (recipients.length === 0) {
    return { message: "None of the selected recipients have a usable phone number (it must include the country code)." };
  }
  const skipped = recipientIds.length - recipients.length;
  const skippedNote = skipped > 0 ? ` ${skipped} skipped — no usable phone number.` : "";

  if (isLocalTestMode()) {
    mockCreateCampaignAndSend({
      channel: "sms",
      subjectEn: "",
      htmlEn: "",
      subjectFr: null,
      htmlFr: null,
      subjectZh: null,
      htmlZh: null,
      ...content,
      fromEmail: "",
      scheduledAt: scheduledAtIso,
      recipients: recipients.map((recipient) => ({ ...recipient, email: null })),
    });
    revalidatePath("/admin/messaging");
    return {
      message:
        (scheduledAtIso
          ? `Scheduled to send to ${recipients.length} recipient(s).`
          : `Sent to ${recipients.length} recipient(s).`) + skippedNote,
    };
  }

  const supabase = getSupabaseAdmin();

  const { data: campaignRow, error: campaignError } = await supabase
    .from("message_campaigns")
    .insert({
      channel: "sms",
      body_en: content.bodyEn,
      body_fr: content.bodyFr,
      body_zh: content.bodyZh,
      status: scheduledAtIso ? "scheduled" : "sending",
      scheduled_at: scheduledAtIso,
    })
    .select("id")
    .single();
  if (campaignError) return { message: `Could not create campaign: ${campaignError.message}` };

  const campaignId = campaignRow.id as string;

  const { data: recipientRows, error: recipientError } = await supabase
    .from("message_recipients")
    .insert(
      recipients.map((recipient) => ({
        campaign_id: campaignId,
        guest_id: recipient.guestId,
        phone: recipient.phone,
        guest_name: recipient.guestName,
        language: recipient.language,
        status: "queued",
      })),
    )
    .select("id, guest_id, phone, language");
  if (recipientError) return { message: `Could not queue recipients: ${recipientError.message}` };

  let sendResults;
  try {
    const smsRows = recipientRows as { id: string; guest_id: string; phone: string; language: "en" | "fr" | "zh" }[];
    const personalize = await personalizer(
      [content.bodyEn, content.bodyFr, content.bodyZh],
      guestById,
      smsRows.map((row) => row.guest_id),
      { html: false },
    );
    sendResults = await sendCampaignSms(
      smsRows.map((row) => ({
        id: row.id,
        phone: row.phone,
        body: personalize(row.guest_id, row.language, smsBodyForLanguage(content, row.language)),
      })),
      await smsStatusCallbackUrl(),
      scheduledAtIso ?? undefined,
    );
  } catch (error) {
    await supabase.from("message_campaigns").update({ status: "failed" }).eq("id", campaignId);
    return {
      message: error instanceof Error ? error.message : "Could not send — check your Twilio configuration.",
    };
  }

  const now = new Date().toISOString();
  let successCount = 0;
  // Twilio has only accepted the message at this point; the status callback
  // moves it on to sent / delivered / failed.
  const acceptedStatus = scheduledAtIso ? "scheduled" : "queued";
  await Promise.all(
    sendResults.map((result) => {
      if (result.sid) {
        successCount++;
        return supabase
          .from("message_recipients")
          .update({ status: acceptedStatus, provider_message_id: result.sid, updated_at: now })
          .eq("id", result.recipientId);
      }
      return supabase
        .from("message_recipients")
        .update({ status: "failed", status_detail: result.error, failed_at: now, updated_at: now })
        .eq("id", result.recipientId);
    }),
  );

  await supabase
    .from("message_campaigns")
    .update({
      status: successCount > 0 ? (scheduledAtIso ? "scheduled" : "sent") : "failed",
      sent_at: scheduledAtIso ? null : now,
    })
    .eq("id", campaignId);

  revalidatePath("/admin/messaging");
  const verb = scheduledAtIso ? "Scheduled to send" : "Sent";
  return {
    message:
      (successCount === recipients.length
        ? `${verb} to ${successCount} recipient(s).`
        : `${verb} to ${successCount} of ${recipients.length} recipient(s) — check the campaign for details.`) +
      skippedNote,
  };
}

export async function cancelCampaign(campaignId: string): Promise<{ message?: string }> {
  await requireAdmin();

  if (isLocalTestMode()) {
    mockCancelCampaign(campaignId);
    revalidatePath("/admin/messaging");
    revalidatePath(`/admin/messaging/${campaignId}`);
    return { message: "Scheduled send canceled." };
  }

  const supabase = getSupabaseAdmin();
  const { data: campaign, error: campaignError } = await supabase
    .from("message_campaigns")
    .select("status, channel")
    .eq("id", campaignId)
    .maybeSingle();
  if (campaignError) return { message: `Could not load campaign: ${campaignError.message}` };
  if (!campaign || campaign.status !== "scheduled") {
    return { message: "This campaign is no longer scheduled." };
  }

  const isSms = campaign.channel === "sms";
  const providerColumn = isSms ? "provider_message_id" : "resend_email_id";
  const { data: recipientRows, error: recipientError } = await supabase
    .from("message_recipients")
    .select(`id, ${providerColumn}`)
    .eq("campaign_id", campaignId)
    .eq("status", "scheduled");
  if (recipientError) return { message: `Could not load recipients: ${recipientError.message}` };

  const cancelable = (recipientRows as unknown as Record<string, string | null>[])
    .map((row) => ({ id: row.id as string, providerId: row[providerColumn] }))
    .filter((row): row is { id: string; providerId: string } => Boolean(row.providerId));

  let results;
  try {
    results = isSms
      ? await cancelScheduledSms(cancelable.map((row) => ({ id: row.id, sid: row.providerId })))
      : await cancelScheduledEmails(cancelable.map((row) => ({ id: row.id, resendEmailId: row.providerId })));
  } catch (error) {
    return { message: error instanceof Error ? error.message : "Could not cancel — check your provider configuration." };
  }

  const now = new Date().toISOString();
  await Promise.all(
    results
      .filter((result) => result.canceled)
      .map((result) =>
        supabase
          .from("message_recipients")
          .update({ status: "canceled", updated_at: now })
          .eq("id", result.recipientId),
      ),
  );

  const canceledCount = results.filter((result) => result.canceled).length;
  if (canceledCount > 0) {
    await supabase.from("message_campaigns").update({ status: "canceled" }).eq("id", campaignId);
  }

  revalidatePath("/admin/messaging");
  revalidatePath(`/admin/messaging/${campaignId}`);
  return canceledCount === cancelable.length
    ? { message: "Scheduled send canceled." }
    : { message: `Canceled ${canceledCount} of ${cancelable.length} — some may have already gone out.` };
}
