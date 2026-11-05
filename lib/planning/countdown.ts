export interface WeddingCountdown {
  isPast: boolean;
  years: number;
  months: number;
  days: number;
  totalDays: number;
  label: string;
}

function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysBetween(start: Date, end: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((end.getTime() - start.getTime()) / msPerDay);
}

function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return count === 1 ? `1 ${singular}` : `${count} ${plural}`;
}

const DATE_LOCALES = { en: "en-IE", fr: "fr-FR", zh: "zh-CN" } as const;

export function formatWeddingDate(iso: string, language: keyof typeof DATE_LOCALES = "en"): string {
  const date = parseIsoDate(iso);
  return new Intl.DateTimeFormat(DATE_LOCALES[language], {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function getWeddingCountdown(
  weddingDateIso: string,
  today = new Date(),
): WeddingCountdown {
  const wedding = parseIsoDate(weddingDateIso);
  const now = startOfDay(today);
  const totalDays = daysBetween(now, wedding);

  if (totalDays < 0) {
    return {
      isPast: true,
      years: 0,
      months: 0,
      days: Math.abs(totalDays),
      totalDays,
      label: `${pluralize(Math.abs(totalDays), "day")} ago`,
    };
  }

  if (totalDays === 0) {
    return {
      isPast: false,
      years: 0,
      months: 0,
      days: 0,
      totalDays: 0,
      label: "Today is the day!",
    };
  }

  const years = Math.floor(totalDays / 365);
  let remainder = totalDays - years * 365;
  const months = Math.floor(remainder / 30);
  remainder -= months * 30;
  const days = remainder;

  const parts: string[] = [];
  if (years > 0) parts.push(pluralize(years, "year"));
  if (months > 0) parts.push(pluralize(months, "month"));
  if (days > 0 || parts.length === 0) parts.push(pluralize(days, "day"));

  return {
    isPast: false,
    years,
    months,
    days,
    totalDays,
    label: parts.join(", "),
  };
}
