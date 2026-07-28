import type { PreferredLanguage } from "@/lib/guests/types";

export interface PhoneCountry {
  id: string;
  label: string;
  dialCode: string;
}

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { id: "IE", label: "Ireland (+353)", dialCode: "353" },
  { id: "GB", label: "United Kingdom (+44)", dialCode: "44" },
  { id: "FR", label: "France (+33)", dialCode: "33" },
  { id: "CN", label: "China (+86)", dialCode: "86" },
  { id: "US", label: "United States (+1)", dialCode: "1" },
  { id: "AU", label: "Australia (+61)", dialCode: "61" },
  { id: "DE", label: "Germany (+49)", dialCode: "49" },
];

const byId = new Map(PHONE_COUNTRIES.map((country) => [country.id, country]));
const byDialCode = new Map(
  [...PHONE_COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length).map((country) => [
    country.dialCode,
    country,
  ]),
);

export function getPhoneCountryById(id: string): PhoneCountry | undefined {
  return byId.get(id);
}

export function defaultPhoneCountryId(language: PreferredLanguage): string {
  switch (language) {
    case "fr":
      return "FR";
    case "zh":
      return "CN";
    default:
      return "IE";
  }
}

/** Digits only — used for login matching and validation. */
export function phoneDigitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** Area code length in national significant number (after trunk prefix is removed). */
export function getAreaCodeLength(dialCode: string, nationalDigits: string): number {
  switch (dialCode) {
    case "353":
      if (nationalDigits.startsWith("1")) return 1;
      return 2;
    case "44":
      if (nationalDigits.startsWith("7")) return 4;
      return 3;
    case "33":
      if (nationalDigits.startsWith("6") || nationalDigits.startsWith("7")) return 1;
      return 2;
    case "86":
      return 3;
    case "1":
      return 3;
    case "61":
      if (nationalDigits.startsWith("4")) return 1;
      return 2;
  }
  return Math.min(3, Math.max(2, Math.floor(nationalDigits.length / 3)));
}

export function findCountryByDialCode(digits: string): PhoneCountry | undefined {
  for (const [dialCode, country] of byDialCode) {
    if (digits.startsWith(dialCode)) return country;
  }
  return undefined;
}
