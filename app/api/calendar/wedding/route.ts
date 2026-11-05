import { NextResponse } from "next/server";
import { buildWeddingCalendarEvent } from "@/lib/calendar/build-event";
import { buildWeddingIcs } from "@/lib/calendar/wedding-event";
import { isPreferredLanguage } from "@/app/guest/_components/language-tabs";
import type { PreferredLanguage } from "@/lib/guests/types";
import { getSiteSettings } from "@/lib/rsvp/queries";

export async function GET(request: Request) {
  const settings = await getSiteSettings();
  const lang = new URL(request.url).searchParams.get("lang");
  const event = buildWeddingCalendarEvent(settings, isPreferredLanguage(lang ?? undefined) ? (lang as PreferredLanguage) : "en");
  if (!event) {
    return NextResponse.json({ message: "Wedding date is not set yet." }, { status: 404 });
  }

  return new NextResponse(buildWeddingIcs(event), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="wedding.ics"',
    },
  });
}
