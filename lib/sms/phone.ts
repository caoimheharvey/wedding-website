import { phoneDigitsOnly } from "@/lib/phone/countries";

/** Turns a stored number (+353(87)9669834, +353 87 123 4567) into E.164, or null when it can't be one. */
export function toE164(stored: string | null | undefined): string | null {
  const value = stored?.trim();
  if (!value || !value.startsWith("+")) return null;
  const digits = phoneDigitsOnly(value);
  if (digits.length < 8 || digits.length > 15) return null;
  return `+${digits}`;
}
