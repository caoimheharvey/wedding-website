import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/i/[token]/route";
import { getGuestSession } from "@/lib/guest-auth/session";
import { createAndSendCampaign } from "@/lib/messaging/actions";
import { fillLinkPlaceholder, hasLinkPlaceholder } from "@/lib/messaging/personalize";
import { db, withTestDatabase } from "./helpers/harness";

const cookieJar = new Map<string, string>();
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ host: "wedding.example" }),
  cookies: async () => ({
    get: (name: string) => (cookieJar.has(name) ? { name, value: cookieJar.get(name)! } : undefined),
    set: (name: string, value: string) => void cookieJar.set(name, value),
    delete: (name: string) => void cookieJar.delete(name),
  }),
}));

const sentEmails: { id: string; email: string; subject: string; html: string }[] = [];
vi.mock("@/lib/email/resend", () => ({
  sendCampaignEmails: async (recipients: typeof sentEmails) => {
    sentEmails.push(...recipients);
    return recipients.map((recipient) => ({ recipientId: recipient.id, resendId: `re_${recipient.id}` }));
  },
  cancelScheduledEmails: async () => [],
}));

withTestDatabase();

beforeAll(() => {
  process.env.AUTH_SECRET = "test-secret-for-guest-sessions";
  process.env.NEXT_PUBLIC_SITE_URL = "https://wedding.example";
  process.env.TWILIO_ACCOUNT_SID = "ACtest";
  process.env.TWILIO_AUTH_TOKEN = "token";
  process.env.TWILIO_MESSAGING_SERVICE_SID = "MGtest";
});

beforeEach(() => {
  cookieJar.clear();
  sentEmails.length = 0;
});

async function newGuest(first: string, options: { email?: string; phone?: string } = {}) {
  const { rows } = await db.query<{ id: string }>(
    `insert into guests (first_name, last_name, relationship_priority, preferred_language, invited_by, email, phone)
     values ($1, 'Linked', 2, 'en', 'caoimhe', $2, $3) returning id`,
    [first, options.email ?? null, options.phone ?? null],
  );
  return rows[0].id;
}

function form(fields: Record<string, string>, recipientIds: string[]) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  for (const id of recipientIds) data.append("recipientIds", id);
  return data;
}

const tokenOf = (url: string) => url.match(/\/i\/([A-Za-z0-9_-]{12})/)?.[1];

describe("the {{link}} placeholder", () => {
  it("is found and filled however the editor wrote it", () => {
    for (const written of ["{{link}}", "{{ link }}", "{{LINK}}", "%7B%7Blink%7D%7D"]) {
      expect(hasLinkPlaceholder(`<a href="${written}">RSVP</a>`)).toBe(true);
      expect(fillLinkPlaceholder(`<a href="${written}">RSVP</a>`, "https://x.test/i/abc")).toBe(
        '<a href="https://x.test/i/abc">RSVP</a>',
      );
    }
    expect(hasLinkPlaceholder("no link here")).toBe(false);
    expect(fillLinkPlaceholder("{{link}} and {{link}}", "U")).toBe("U and U");
  });
});

describe("personal links in an email blast", () => {
  it("gives each guest their own link, keeps it stable across sends, and stores no credential in the campaign", async () => {
    const ada = await newGuest("Ada", { email: "ada@example.com" });
    const bea = await newGuest("Bea", { email: "bea@example.com" });
    const html = '<p>Hello</p><a href="%7B%7Blink%7D%7D">RSVP here</a>';

    const result = await createAndSendCampaign(
      undefined,
      form({ channel: "email", subjectEn: "RSVP", htmlEn: html }, [ada, bea]),
    );
    expect(result?.message).toBe("Sent to 2 recipient(s).");

    const links = Object.fromEntries(sentEmails.map((mail) => [mail.email, mail.html.match(/href="([^"]+)"/)![1]]));
    expect(links["ada@example.com"]).toMatch(/^https:\/\/wedding\.example\/i\/[A-Za-z0-9_-]{12}$/);
    expect(links["ada@example.com"]).not.toBe(links["bea@example.com"]);

    const { rows } = await db.query<{ html_en: string }>("select html_en from message_campaigns where subject_en = 'RSVP'");
    expect(rows[0].html_en).toBe(html);

    sentEmails.length = 0;
    await createAndSendCampaign(undefined, form({ channel: "email", subjectEn: "Reminder", htmlEn: html }, [ada]));
    expect(sentEmails[0].html).toContain(links["ada@example.com"]);
  });

  it("creates no links when the message has no placeholder", async () => {
    const guest = await newGuest("Plain", { email: "plain@example.com" });
    await createAndSendCampaign(undefined, form({ channel: "email", subjectEn: "Hi", htmlEn: "<p>no link</p>" }, [guest]));
    const { rows } = await db.query("select 1 from guest_invite_links where guest_id = $1", [guest]);
    expect(rows).toHaveLength(0);
  });
});

describe("personal links in a text blast", () => {
  it("texts each guest their own link", async () => {
    const bodies: Record<string, string> = {};
    vi.stubGlobal("fetch", async (_url: string, init: { body: URLSearchParams }) => {
      bodies[init.body.get("To")!] = init.body.get("Body")!;
      return new Response(JSON.stringify({ sid: `SM${Object.keys(bodies).length}` }), { status: 201 });
    });
    const one = await newGuest("One", { phone: "+353(87)7770001" });
    const two = await newGuest("Two", { phone: "+353(87)7770002" });

    await createAndSendCampaign(undefined, form({ channel: "sms", bodyEn: "RSVP here: {{link}}" }, [one, two]));
    vi.unstubAllGlobals();

    const first = tokenOf(bodies["+353877770001"]);
    const second = tokenOf(bodies["+353877770002"]);
    expect(bodies["+353877770001"]).toBe(`RSVP here: https://wedding.example/i/${first}`);
    expect(first).toBeDefined();
    expect(first).not.toBe(second);
  });
});

describe("opening a personal link", () => {
  async function linkFor(guestId: string) {
    await createAndSendCampaign(
      undefined,
      form({ channel: "email", subjectEn: `Link ${guestId}`, htmlEn: '<a href="{{link}}">x</a>' }, [guestId]),
    );
    return tokenOf(sentEmails.at(-1)!.html)!;
  }

  it("signs the guest in and sends them to the site", async () => {
    const guest = await newGuest("Signed", { email: "signed@example.com" });
    const token = await linkFor(guest);

    const response = await GET(new Request(`https://wedding.example/i/${token}`), { params: Promise.resolve({ token }) });

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://wedding.example/");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(await getGuestSession()).toEqual({ guestId: guest });
  });

  it("leaves an unknown link on the normal sign-in page", async () => {
    const response = await GET(new Request("https://wedding.example/i/doesnotexist1"), {
      params: Promise.resolve({ token: "doesnotexist1" }),
    });
    expect(response.headers.get("location")).toBe("https://wedding.example/");
    expect(await getGuestSession()).toBeNull();
  });

  it("stops working once the guest's link is revoked", async () => {
    const guest = await newGuest("Revoked", { email: "revoked@example.com" });
    const token = await linkFor(guest);
    await db.query("delete from guest_invite_links where guest_id = $1", [guest]);

    await GET(new Request(`https://wedding.example/i/${token}`), { params: Promise.resolve({ token }) });
    expect(await getGuestSession()).toBeNull();
  });

  it("is removed along with the guest", async () => {
    const guest = await newGuest("Deleted", { email: "deleted@example.com" });
    await linkFor(guest);
    await db.query("delete from guests where id = $1", [guest]);
    const { rows } = await db.query("select 1 from guest_invite_links where guest_id = $1", [guest]);
    expect(rows).toHaveLength(0);
  });
});
