import { NextResponse } from "next/server";
import { Resend } from "resend";
import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { RecipientStatus } from "@/lib/messaging/types";

const EVENT_STATUS: Partial<Record<string, RecipientStatus>> = {
  "email.sent": "sent",
  "email.delivered": "delivered",
  "email.delivery_delayed": "delayed",
  "email.bounced": "bounced",
  "email.complained": "complained",
  "email.failed": "failed",
};

function detailFor(type: string, data: Record<string, unknown>): string | null {
  if (type === "email.bounced" && data.bounce && typeof data.bounce === "object") {
    return (data.bounce as { message?: string }).message ?? null;
  }
  if (type === "email.failed" && data.failed && typeof data.failed === "object") {
    return (data.failed as { reason?: string }).reason ?? null;
  }
  return null;
}

export async function POST(request: Request) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ message: "Webhook is not configured" }, { status: 500 });
  }

  const payload = await request.text();
  const id = request.headers.get("webhook-id");
  const timestamp = request.headers.get("webhook-timestamp");
  const signature = request.headers.get("webhook-signature");
  if (!id || !timestamp || !signature) {
    return NextResponse.json({ message: "Missing webhook signature headers" }, { status: 400 });
  }

  let event;
  try {
    const resend = new Resend(process.env.RESEND_API_KEY ?? "");
    event = resend.webhooks.verify({ payload, headers: { id, timestamp, signature }, webhookSecret });
  } catch {
    return NextResponse.json({ message: "Invalid webhook signature" }, { status: 401 });
  }

  const status = EVENT_STATUS[event.type];
  if (!status || !("email_id" in event.data)) return NextResponse.json({ received: true });

  const emailId = event.data.email_id;
  const now = new Date().toISOString();
  const update: Record<string, unknown> = { status, updated_at: now };
  if (status === "sent") update.sent_at = now;
  if (status === "delivered") update.delivered_at = now;
  if (status === "bounced" || status === "failed") update.failed_at = now;
  const detail = detailFor(event.type, event.data as unknown as Record<string, unknown>);
  if (detail) update.status_detail = detail;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("message_recipients")
    .update(update)
    .eq("resend_email_id", emailId)
    .select("campaign_id")
    .maybeSingle();

  if (!error && data) {
    revalidatePath(`/admin/messaging/${data.campaign_id}`);
  }

  return NextResponse.json({ received: true });
}
