"use client";

import { PHONE_COUNTRIES } from "@/lib/phone/countries";
import { formatStoredPhoneForCountry } from "@/lib/phone/format";

export function PhoneInput({
  countryId,
  national,
  onCountryChange,
  onNationalChange,
  placeholder,
  className = "",
}: {
  countryId: string;
  national: string;
  onCountryChange: (countryId: string) => void;
  onNationalChange: (national: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const preview = formatStoredPhoneForCountry(countryId, national);

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="flex gap-2">
        <select
          value={countryId}
          onChange={(event) => onCountryChange(event.target.value)}
          className="input w-auto max-w-[46%] shrink-0 text-center text-sm"
          aria-label="Country code"
        >
          {PHONE_COUNTRIES.map((country) => (
            <option key={country.id} value={country.id}>
              {country.label}
            </option>
          ))}
        </select>
        <input
          type="tel"
          value={national}
          onChange={(event) => onNationalChange(event.target.value)}
          placeholder={placeholder}
          className="input min-w-0 flex-1 text-center"
          autoComplete="tel-national"
          inputMode="tel"
        />
      </div>
      {preview && (
        <p className="text-xs text-foreground/50" aria-live="polite">
          {preview}
        </p>
      )}
    </div>
  );
}
