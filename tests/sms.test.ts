import { createHmac } from "node:crypto";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cancelCampaign, createAndSendCampaign } from "@/lib/messaging/actions";
import { campaignTitle, recipientContact } from "@/lib/messaging/types";
import { toE164 } from "@/lib/sms/phone";
import { smsLength } from "@/lib/sms/segments";
import { isValidTwilioSignature, recipientStatusFromTwilio } from "@/lib/sms/twilio";
import { db, withTestDatabase } from "./helpers/harness";

vi.mock("next/headers", () => ({ headers: async () => new Headers({ host: "wedding.example" }) }));

withTestDatabase();

const AUTH_TOKEN = "test-auth-token";
const hour = 60 * 60_000;

beforeAll(() => {
  process.env.TWILIO_ACCOUNT_SID = "ACtest";
  process.env.TWILIO_AUTH_TOKEN = AUTH_TOKEN;
  process.env.TWILIO_MESSAGING_SERVICE_SID = "MGtest";
  process.env.NEXT_PUBLIC_SITE_URL = "wedding.example"; // bare host, as it was set in production once
});

afterEach(() => vi.unstubAllGlobals());

interface TwilioCall {
  url: string;
  params: Record<string, string>;
}

/** Replaces fetch with a Twilio that accepts everything and hands out sequential SIDs. */
function fakeTwilio(options: { rejectPhone?: string } = {}) {
  const calls: TwilioCall[] = [];
  let counter = 0;
  vi.stubGlobal("fetch", async (url: string, init: { body: URLSearchParams }) => {
    const params = Object.fromEntries(init.body.entries());
    calls.push({ url, params });
    if (options.rejectPhone && params.To === options.rejectPhone) {
      return new Response(JSON.stringify({ message: "Invalid 'To' number" }), { status: 400 });
    }
    return new Response(JSON.stringify({ sid: `SM${++counter}` }), { status: 201 });
  });
  return calls;
}

async function newGuest(first: string, phone: string | null, language = "en") {
  const { rows } = await db.query<{ id: string }>(
    `insert into guests (first_name, last_name, relationship_priority, preferred_language, invited_by, phone)
     values ($1, 'Guest', 2, $2, 'caoimhe', $3) returning id`,
    [first, language, phone],
  );
  return rows[0].id;
}

function smsForm(fields: Record<string, string>, recipientIds: string[]) {
  const form = new FormData();
  form.set("channel", "sms");
  for (const [key, value] of Object.entries(fields)) form.set(key, value);
  for (const id of recipientIds) form.append("recipientIds", id);
  return form;
}

describe("phone numbers", () => {
  it("turns the stored formats into E.164 and rejects numbers without a country code", () => {
    expect(toE164("+353(87)9669834")).toBe("+353879669834");
    expect(toE164("+353 87 123 4567")).toBe("+353871234567");
    expect(toE164("+86 138 0000 0000")).toBe("+8613800000000");
    expect(toE164("+31(6)12345678")).toBe("+31612345678");
    expect(toE164("0871234567")).toBeNull();
    expect(toE164("+12")).toBeNull();
    expect(toE164("")).toBeNull();
    expect(toE164(null)).toBeNull();
  });
});

describe("message length", () => {
  it("counts segments for plain and non-plain text", () => {
    expect(smsLength("Save the date!")).toMatchObject({ gsm: true, segments: 1 });
    expect(smsLength("a".repeat(161)).segments).toBe(2);
    expect(smsLength("€".repeat(80)).units).toBe(160); // extension characters count twice
    expect(smsLength("请于六月前回复")).toMatchObject({ gsm: false, segments: 1 });
    expect(smsLength("").segments).toBe(0);
  });
});

describe("Twilio status callbacks", () => {
  it("maps Twilio statuses onto the recipient statuses", () => {
    expect(recipientStatusFromTwilio("delivered")).toBe("delivered");
    expect(recipientStatusFromTwilio("undelivered")).toBe("failed");
    expect(recipientStatusFromTwilio("accepted")).toBe("queued");
    expect(recipientStatusFromTwilio("canceled")).toBe("canceled");
    expect(recipientStatusFromTwilio("something-new")).toBeNull();
  });

  const sign = (url: string, params: Record<string, string>) =>
    createHmac("sha1", AUTH_TOKEN)
      .update(
        Object.keys(params)
          .sort()
          .reduce((acc, key) => acc + key + params[key], url),
      )
      .digest("base64");

  it("accepts a correctly signed request and rejects tampering", () => {
    const url = "https://wedding.example/api/webhooks/twilio";
    const params = { MessageSid: "SM1", MessageStatus: "delivered", To: "+353879669834" };
    const signature = sign(url, params);
    expect(isValidTwilioSignature(AUTH_TOKEN, url, params, signature)).toBe(true);
    expect(isValidTwilioSignature(AUTH_TOKEN, url, { ...params, MessageStatus: "failed" }, signature)).toBe(false);
    expect(isValidTwilioSignature(AUTH_TOKEN, "https://evil.example/api/webhooks/twilio", params, signature)).toBe(false);
    expect(isValidTwilioSignature(AUTH_TOKEN, url, params, null)).toBe(false);
  });

  it("updates the recipient when Twilio reports delivery, and refuses unsigned calls", async () => {
    fakeTwilio();
    const guest = await newGuest("Webhook", "+353(87)1110001");
    await createAndSendCampaign(undefined, smsForm({ bodyEn: "Hello" }, [guest]));
    const { rows } = await db.query<{ provider_message_id: string }>(
      "select provider_message_id from message_recipients where guest_id = $1",
      [guest],
    );
    const sid = rows[0].provider_message_id;

    const { POST } = await import("@/app/api/webhooks/twilio/route");
    const url = "https://wedding.example/api/webhooks/twilio";
    const params = { MessageSid: sid, MessageStatus: "delivered" };

    const unsigned = await POST(new Request(url, { method: "POST", body: new URLSearchParams(params) }));
    expect(unsigned.status).toBe(401);

    const signed = await POST(
      new Request(url, {
        method: "POST",
        body: new URLSearchParams(params),
        headers: { "x-twilio-signature": sign(url, params) },
      }),
    );
    expect(signed.status).toBe(200);

    const after = await db.query<{ status: string; delivered_at: string | null }>(
      "select status, delivered_at from message_recipients where guest_id = $1",
      [guest],
    );
    expect(after.rows[0].status).toBe("delivered");
    expect(after.rows[0].delivered_at).not.toBeNull();
  });
});

describe("sending a text campaign", () => {
  it("texts each guest in their language, skips numbers that can't be used, and records the Twilio SIDs", async () => {
    const calls = fakeTwilio();
    const irish = await newGuest("Irish", "+353(87)2220001", "en");
    const french = await newGuest("French", "+33(6)12345678", "fr");
    const noPhone = await newGuest("NoPhone", null);
    const noCountryCode = await newGuest("NoCode", "0871234567");

    const result = await createAndSendCampaign(
      undefined,
      smsForm({ bodyEn: "Save the date", bodyFr: "Réservez la date" }, [irish, french, noPhone, noCountryCode]),
    );

    expect(result?.message).toBe("Sent to 2 recipient(s). 2 skipped — no usable phone number.");
    expect(calls).toHaveLength(2);
    expect(calls.every((call) => call.url.includes("/Accounts/ACtest/Messages.json"))).toBe(true);
    const byPhone = Object.fromEntries(calls.map((call) => [call.params.To, call.params]));
    expect(byPhone["+353872220001"]).toMatchObject({
      Body: "Save the date",
      MessagingServiceSid: "MGtest",
      StatusCallback: "https://wedding.example/api/webhooks/twilio",
    });
    expect(byPhone["+33612345678"].Body).toBe("Réservez la date");
    expect(byPhone["+353872220001"].SendAt).toBeUndefined();

    const { rows: campaigns } = await db.query<Record<string, unknown>>(
      "select * from message_campaigns where channel = 'sms' and body_en = 'Save the date'",
    );
    expect(campaigns).toHaveLength(1);
    expect(campaigns[0]).toMatchObject({ status: "sent", subject_en: null, html_en: null, from_email: null });
    expect(campaignTitle({ channel: "sms", subjectEn: "", bodyEn: "Save the date" })).toBe("Save the date");

    const { rows: recipients } = await db.query<Record<string, unknown>>(
      "select * from message_recipients where campaign_id = $1 order by phone",
      [campaigns[0].id],
    );
    expect(recipients.map((row) => row.phone)).toEqual(["+33612345678", "+353872220001"]);
    expect(recipients.every((row) => row.email === null && /^SM\d+$/.test(String(row.provider_message_id)))).toBe(true);
    expect(recipients.every((row) => row.status === "queued")).toBe(true);
    expect(recipientContact({ email: null, phone: "+33612345678" })).toBe("+33612345678");
  });

  it("marks a recipient Twilio rejects as failed and keeps the rest", async () => {
    fakeTwilio({ rejectPhone: "+353873330001" });
    const bad = await newGuest("Rejected", "+353(87)3330001");
    const good = await newGuest("Accepted", "+353(87)3330002");

    const result = await createAndSendCampaign(undefined, smsForm({ bodyEn: "Partial send" }, [bad, good]));
    expect(result?.message).toContain("Sent to 1 of 2 recipient(s)");

    const { rows } = await db.query<{ phone: string; status: string; status_detail: string | null }>(
      `select r.phone, r.status, r.status_detail from message_recipients r
       join message_campaigns c on c.id = r.campaign_id where c.body_en = 'Partial send' order by r.phone`,
    );
    expect(rows).toEqual([
      { phone: "+353873330001", status: "failed", status_detail: "Invalid 'To' number" },
      { phone: "+353873330002", status: "queued", status_detail: null },
    ]);
  });

  it("refuses an empty text and a send with nobody to text", async () => {
    const calls = fakeTwilio();
    const guest = await newGuest("Empty", "+353(87)4440001");
    const noPhone = await newGuest("Nobody", null);

    const empty = await createAndSendCampaign(undefined, smsForm({ bodyEn: "  " }, [guest]));
    expect(empty?.errors?.bodyEn).toBeDefined();

    const nobody = await createAndSendCampaign(undefined, smsForm({ bodyEn: "Hi" }, [noPhone]));
    expect(nobody?.message).toContain("usable phone number");
    expect(calls).toHaveLength(0);
  });

  it("schedules a text, then cancels it through Twilio", async () => {
    const calls = fakeTwilio();
    const guest = await newGuest("Scheduled", "+353(87)5550001");
    const sendAt = new Date(Date.now() + 48 * hour).toISOString();

    const result = await createAndSendCampaign(undefined, smsForm({ bodyEn: "See you soon", scheduledAt: sendAt }, [guest]));
    expect(result?.message).toBe("Scheduled to send to 1 recipient(s).");
    expect(calls[0].params).toMatchObject({ ScheduleType: "fixed", SendAt: sendAt });

    const { rows: campaigns } = await db.query<{ id: string; status: string }>(
      "select id, status from message_campaigns where body_en = 'See you soon'",
    );
    expect(campaigns[0].status).toBe("scheduled");

    const before = calls.length;
    const cancelled = await cancelCampaign(campaigns[0].id);
    expect(cancelled.message).toBe("Scheduled send canceled.");
    expect(calls.length).toBe(before + 1);
    expect(calls.at(-1)?.url).toMatch(/\/Messages\/SM\d+\.json$/);
    expect(calls.at(-1)?.params).toEqual({ Status: "canceled" });

    const { rows: after } = await db.query<{ status: string }>(
      "select status from message_recipients where campaign_id = $1",
      [campaigns[0].id],
    );
    expect(after.map((row) => row.status)).toEqual(["canceled"]);
  });

  it("will not send a text immediately when the schedule is outside what Twilio allows", async () => {
    const calls = fakeTwilio();
    const guest = await newGuest("TooSoon", "+353(87)6660001");

    const soon = await createAndSendCampaign(
      undefined,
      smsForm({ bodyEn: "Too soon", scheduledAt: new Date(Date.now() + 5 * 60_000).toISOString() }, [guest]),
    );
    const far = await createAndSendCampaign(
      undefined,
      smsForm({ bodyEn: "Too far", scheduledAt: new Date(Date.now() + 40 * 24 * hour).toISOString() }, [guest]),
    );

    expect(soon?.message).toContain("between 15 minutes and 35 days");
    expect(far?.message).toContain("between 15 minutes and 35 days");
    expect(calls).toHaveLength(0);
    const { rows } = await db.query("select 1 from message_campaigns where body_en in ('Too soon', 'Too far')");
    expect(rows).toHaveLength(0);
  });
});

describe("the database keeps the two channels apart", () => {
  it("rejects a text campaign without a body, and an email campaign without a subject", async () => {
    await expect(db.query("insert into message_campaigns (channel, status) values ('sms', 'sent')")).rejects.toThrow();
    await expect(
      db.query("insert into message_campaigns (channel, html_en, from_email, status) values ('email', '<p>x</p>', 'a@b.c', 'sent')"),
    ).rejects.toThrow();
    await expect(db.query("insert into message_campaigns (channel, body_en, status) values ('fax', 'x', 'sent')")).rejects.toThrow();
  });

  it("rejects a recipient with neither an email nor a phone", async () => {
    const { rows } = await db.query<{ id: string }>(
      "insert into message_campaigns (channel, body_en, status) values ('sms', 'x', 'sent') returning id",
    );
    await expect(
      db.query("insert into message_recipients (campaign_id, status) values ($1, 'queued')", [rows[0].id]),
    ).rejects.toThrow();
  });
});
