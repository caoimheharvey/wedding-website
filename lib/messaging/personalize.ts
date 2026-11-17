/**
 * Merge fields a message can contain. {{link}} becomes the recipient's own
 * sign-in link, so tapping it lands them on the site already signed in.
 * Canva and other editors percent-encode the braces inside a button's href,
 * so that form is accepted too.
 */
export const LINK_PLACEHOLDER = "{{link}}";

const LINK_PATTERN = /\{\{\s*link\s*\}\}|%7B%7B\s*link\s*%7D%7D/gi;

export function hasLinkPlaceholder(text: string | null | undefined): boolean {
  return Boolean(text) && new RegExp(LINK_PATTERN.source, "i").test(text!);
}

export function fillLinkPlaceholder(text: string, url: string): string {
  return text.replace(LINK_PATTERN, url);
}
