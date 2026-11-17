import type { PreferredLanguage } from "@/lib/guests/types";

/**
 * Merge fields a message can contain, filled in separately for each guest:
 *  - {{link}}       the guest's own sign-in link, so opening it signs them in
 *  - {{first_name}} the guest's first name
 * Canva and other editors percent-encode the braces inside a button's href,
 * so that form of {{link}} is accepted too.
 */
export const LINK_PLACEHOLDER = "{{link}}";
export const FIRST_NAME_PLACEHOLDER = "{{first_name}}";

const LINK_PATTERN = /\{\{\s*link\s*\}\}|%7B%7B\s*link\s*%7D%7D/gi;
const FIRST_NAME_PATTERN = /\{\{\s*first_name\s*\}\}/gi;

/** What {{first_name}} becomes for a guest we have no first name for, so "Hi {{first_name}}," still reads. */
const NAMELESS_FALLBACK: Record<PreferredLanguage, string> = { en: "there", fr: "à vous", zh: "朋友" };

export function hasLinkPlaceholder(text: string | null | undefined): boolean {
  return Boolean(text) && new RegExp(LINK_PATTERN.source, "i").test(text!);
}

export function hasFirstNamePlaceholder(text: string | null | undefined): boolean {
  return Boolean(text) && new RegExp(FIRST_NAME_PATTERN.source, "i").test(text!);
}

export function fillLinkPlaceholder(text: string, url: string): string {
  return text.replace(LINK_PATTERN, () => url);
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function fillFirstNamePlaceholder(
  text: string,
  firstName: string | null | undefined,
  options: { language: PreferredLanguage; html: boolean },
): string {
  const name = firstName?.trim() || NAMELESS_FALLBACK[options.language];
  return text.replace(FIRST_NAME_PATTERN, () => (options.html ? escapeHtml(name) : name));
}
