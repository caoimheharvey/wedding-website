"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isLocalTestMode } from "@/lib/local-test";
import { listGuests } from "@/lib/guests/queries";
import { guestDisplayName } from "@/lib/guest-site/party-names";
import { cancelScheduledEmails, sendCampaignEmails } from "@/lib/email/resend";
import { mockCancelCampaign, mockCreateCampaignAndSend } from "./mock-store";
import { composeMessageFormSchema } from "./schema";

const DEFAULT_FROM_EMAIL = "onboarding@resend.dev";

export type ComposeMessageState =
  | { errors: Record<string, string[] | undefined>; message?: string }
  | { errors?: undefined; message?: string }
  | undefined;

export async function createAndSendCampaign(
  _prevState: ComposeMessageState,
  formData: FormData,
): Promise<ComposeMessageState> {
  await requireAdmin();

  const parsed = composeMessageFormSchema.safeParse({
    subject: formData.get("subject"),
    html: formData.get("html"),
    recipientIds: formData.getAll("recipientIds"),
    scheduledAt: formData.get("scheduledAt") || undefined,
  });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };

  const { subject, html, recipientIds, scheduledAt } = parsed.data;
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
    }));

  if (recipients.length === 0) {
    return { message: "None of the selected recipients have an email on file." };
  }

  if (isLocalTestMode()) {
    mockCreateCampaignAndSend({ subject, html, fromEmail, scheduledAt: scheduledAtIso, recipients });
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
      subject,
      html,
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
        status: "queued",
      })),
    )
    .select("id, email");
  if (recipientError) return { message: `Could not queue recipients: ${recipientError.message}` };

  let sendResults;
  try {
    sendResults = await sendCampaignEmails(
      (recipientRows as { id: string; email: string }[]).map((row) => ({ id: row.id, email: row.email })),
      subject,
      html,
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
    .select("status")
    .eq("id", campaignId)
    .maybeSingle();
  if (campaignError) return { message: `Could not load campaign: ${campaignError.message}` };
  if (!campaign || campaign.status !== "scheduled") {
    return { message: "This campaign is no longer scheduled." };
  }

  const { data: recipientRows, error: recipientError } = await supabase
    .from("message_recipients")
    .select("id, resend_email_id")
    .eq("campaign_id", campaignId)
    .eq("status", "scheduled");
  if (recipientError) return { message: `Could not load recipients: ${recipientError.message}` };

  const cancelable = (recipientRows as { id: string; resend_email_id: string | null }[]).filter(
    (row): row is { id: string; resend_email_id: string } => Boolean(row.resend_email_id),
  );

  const results = await cancelScheduledEmails(
    cancelable.map((row) => ({ id: row.id, resendEmailId: row.resend_email_id })),
  );

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
