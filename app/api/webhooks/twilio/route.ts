import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isValidTwilioSignature, recipientStatusFromTwilio } from "@/lib/sms/twilio";
import { configuredSiteOrigin } from "@/lib/site-url";

export async function POST(request: Request) {
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  if (!authToken) {
    return NextResponse.json({ message: "Webhook is not configured" }, { status: 500 });
  }

  // Twilio signs the exact URL it was given as the StatusCallback.
  const requestUrl = new URL(request.url);
  const url = `${configuredSiteOrigin() ?? requestUrl.origin}${requestUrl.pathname}`;

  const form = await request.formData();
  const params: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value === "string") params[key] = value;
  }

  if (!isValidTwilioSignature(authToken, url, params, request.headers.get("x-twilio-signature"))) {
    return NextResponse.json({ message: "Invalid webhook signature" }, { status: 401 });
  }

  const status = recipientStatusFromTwilio(params.MessageStatus ?? params.SmsStatus);
  const sid = params.MessageSid ?? params.SmsSid;
  if (!status || !sid) return NextResponse.json({ received: true });

  const now = new Date().toISOString();
  const update: Record<string, unknown> = { status, updated_at: now };
  if (status === "sent") update.sent_at = now;
  if (status === "delivered") update.delivered_at = now;
  if (status === "failed") {
    update.failed_at = now;
    const code = params.ErrorCode;
    update.status_detail = code ? `Twilio error ${code}` : (params.ErrorMessage ?? null);
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("message_recipients")
    .update(update)
    .eq("provider_message_id", sid)
    .select("campaign_id")
    .maybeSingle();

  if (!error && data) {
    revalidatePath(`/admin/messaging/${data.campaign_id}`);
  }

  return NextResponse.json({ received: true });
}
