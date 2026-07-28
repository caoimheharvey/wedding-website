import { NextResponse } from "next/server";
import { buildWeddingIcs, DEFAULT_WEDDING_EVENT_TITLE } from "@/lib/calendar/wedding-event";
import { GUEST_SITE_STRINGS } from "@/lib/guest-site/i18n";
import { getSiteSettings } from "@/lib/rsvp/queries";

export async function GET() {
  const settings = await getSiteSettings();
  if (!settings.weddingDate) {
    return NextResponse.json({ message: "Wedding date is not set yet." }, { status: 404 });
  }

  const ics = buildWeddingIcs({
    title: DEFAULT_WEDDING_EVENT_TITLE,
    dateIso: settings.weddingDate,
    location: settings.weddingLocation,
    description: GUEST_SITE_STRINGS.en.weddingDateSection.calendarDescription,
  });

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="wedding.ics"',
    },
  });
}
