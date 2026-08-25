"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isLocalTestMode } from "@/lib/local-test";
import { listGuests } from "@/lib/guests/queries";
import { guestDisplayName } from "@/lib/guest-site/party-names";
import { sendCampaignEmails } from "@/lib/email/resend";
import { mockCreateCampaignAndSend } from "./mock-store";
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
  });
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };

  const { subject, html, recipientIds } = parsed.data;
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim() || DEFAULT_FROM_EMAIL;

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
    mockCreateCampaignAndSend({ subject, html, fromEmail, recipients });
    revalidatePath("/admin/messaging");
    return { message: `Sent to ${recipients.length} recipient(s).` };
  }

  const supabase = getSupabaseAdmin();

  const { data: campaignRow, error: campaignError } = await supabase
    .from("message_campaigns")
    .insert({ subject, html, from_email: fromEmail, status: "sending" })
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
    );
  } catch (error) {
    await supabase.from("message_campaigns").update({ status: "failed" }).eq("id", campaignId);
    return {
      message: error instanceof Error ? error.message : "Could not send — check your Resend configuration.",
    };
  }

  const now = new Date().toISOString();
  let successCount = 0;
  await Promise.all(
    sendResults.map((result) => {
      if (result.resendId) {
        successCount++;
        return supabase
          .from("message_recipients")
          .update({ status: "sent", resend_email_id: result.resendId, sent_at: now, updated_at: now })
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
    .update({ status: successCount > 0 ? "sent" : "failed", sent_at: now })
    .eq("id", campaignId);

  revalidatePath("/admin/messaging");
  return {
    message:
      successCount === recipients.length
        ? `Sent to ${successCount} recipient(s).`
        : `Sent to ${successCount} of ${recipients.length} recipient(s) — check the campaign for details.`,
  };
}
