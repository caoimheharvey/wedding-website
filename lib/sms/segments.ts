// GSM-7 basic set plus the extension characters (which cost two slots each).
const GSM_BASIC =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
const GSM_EXTENDED = "^{}\\[~]|€";

export interface SmsLength {
  /** True when every character fits the GSM-7 alphabet; otherwise the text is sent as UCS-2 (e.g. Mandarin, curly quotes). */
  gsm: boolean;
  /** Characters counted against the segment limits (extension characters count twice in GSM-7). */
  units: number;
  segments: number;
}

export function smsLength(text: string): SmsLength {
  let units = 0;
  let gsm = true;
  for (const char of text) {
    if (GSM_BASIC.includes(char)) units += 1;
    else if (GSM_EXTENDED.includes(char)) units += 2;
    else {
      gsm = false;
      break;
    }
  }
  if (!gsm) {
    // UCS-2 counts UTF-16 code units, so an emoji takes two.
    units = text.length;
    return { gsm, units, segments: units === 0 ? 0 : units <= 70 ? 1 : Math.ceil(units / 67) };
  }
  return { gsm, units, segments: units === 0 ? 0 : units <= 160 ? 1 : Math.ceil(units / 153) };
}

/** Longest text we allow in one campaign — about three GSM-7 segments or nine UCS-2 ones. */
export const SMS_MAX_CHARACTERS = 480;
