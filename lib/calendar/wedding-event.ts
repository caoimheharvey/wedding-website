export interface WeddingCalendarEvent {
  title: string;
  dateIso: string;
  location?: string | null;
  description?: string | null;
}

function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatIcsDate(iso: string): string {
  return iso.replace(/-/g, "");
}

function escapeIcsText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export function buildWeddingIcs(event: WeddingCalendarEvent): string {
  const start = formatIcsDate(event.dateIso);
  const endDate = parseIsoDate(event.dateIso);
  endDate.setDate(endDate.getDate() + 1);
  const end = formatIcsDate(
    `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`,
  );

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Caoimhe & Alexandre//Wedding//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:wedding-${start}@caoimhealexandrewedding.com`,
    `DTSTAMP:${formatIcsDate(new Date().toISOString().slice(0, 10))}T000000Z`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
  ];

  if (event.location?.trim()) {
    lines.push(`LOCATION:${escapeIcsText(event.location.trim())}`);
  }
  if (event.description?.trim()) {
    lines.push(`DESCRIPTION:${escapeIcsText(event.description.trim())}`);
  }

  lines.push("END:VEVENT", "END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
}

export function buildGoogleCalendarUrl(event: WeddingCalendarEvent): string {
  const start = formatIcsDate(event.dateIso);
  const endDate = parseIsoDate(event.dateIso);
  endDate.setDate(endDate.getDate() + 1);
  const end = formatIcsDate(
    `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`,
  );

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${start}/${end}`,
  });
  if (event.location?.trim()) params.set("location", event.location.trim());
  if (event.description?.trim()) params.set("details", event.description.trim());

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export const DEFAULT_WEDDING_EVENT_TITLE = "Caoimhe & Alexandre's Wedding";
