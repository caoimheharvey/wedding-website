import {
  findCountryByDialCode,
  getAreaCodeLength,
  getPhoneCountryById,
  phoneDigitsOnly,
  type PhoneCountry,
} from "./countries";

const STORED_PHONE_PATTERN = /^\+(\d{1,4})\((\d+)\)(\d+)$/;

export interface ParsedPhone {
  countryId: string;
  national: string;
}

function stripToNationalDigits(dialCode: string, raw: string): string {
  let digits = phoneDigitsOnly(raw);
  if (digits.startsWith(dialCode)) {
    digits = digits.slice(dialCode.length);
  }
  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  return digits;
}

/** Formats as +353(87)9669834 */
export function formatStoredPhone(dialCode: string, rawNational: string): string | null {
  const national = stripToNationalDigits(dialCode, rawNational);
  if (national.length < 4) return null;

  const areaLength = getAreaCodeLength(dialCode, national);
  const area = national.slice(0, areaLength);
  const subscriber = national.slice(areaLength);
  if (!area || !subscriber) return null;

  return `+${dialCode}(${area})${subscriber}`;
}

export function formatStoredPhoneForCountry(
  countryId: string,
  rawNational: string,
): string | null {
  const country = getPhoneCountryById(countryId);
  if (!country) return null;
  return formatStoredPhone(country.dialCode, rawNational);
}

export function parseStoredPhone(
  value: string | null | undefined,
  defaultCountryId: string,
): ParsedPhone {
  if (!value?.trim()) {
    return { countryId: defaultCountryId, national: "" };
  }

  const trimmed = value.trim();
  const match = trimmed.match(STORED_PHONE_PATTERN);
  if (match) {
    const dialCode = match[1];
    const country = findCountryByDialCode(dialCode);
    return {
      countryId: country?.id ?? defaultCountryId,
      national: `${match[2]}${match[3]}`,
    };
  }

  const digits = phoneDigitsOnly(trimmed);
  const country = findCountryByDialCode(digits);
  if (country) {
    return {
      countryId: country.id,
      national: digits.slice(country.dialCode.length).replace(/^0/, ""),
    };
  }

  return {
    countryId: defaultCountryId,
    national: digits.replace(/^0/, ""),
  };
}

/** Compare two phone values ignoring formatting differences. */
export function phonesMatch(a: string, b: string): boolean {
  return phoneDigitsOnly(a) === phoneDigitsOnly(b);
}

export function isValidStoredPhone(value: string): boolean {
  return STORED_PHONE_PATTERN.test(value.trim());
}

export function describePhoneCountry(country: PhoneCountry): string {
  return country.label;
}
