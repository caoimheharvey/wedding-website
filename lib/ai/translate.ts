import "server-only";
import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-sonnet-5";

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY environment variable");
  }
  return new Anthropic({ apiKey });
}

export async function complete(prompt: string, maxTokens = 1024): Promise<string> {
  const client = getClient();
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  });
  const block = message.content.find((entry) => entry.type === "text");
  return block?.type === "text" ? block.text.trim() : "";
}

export async function translateText(
  text: string,
  targetLanguage: "fr" | "zh",
): Promise<string> {
  const languageName = targetLanguage === "fr" ? "French" : "Mandarin Chinese";
  return complete(
    `Translate the following wedding website text into ${languageName}. Keep the tone warm and personal, matching how a couple would write to their own wedding guests. Only output the translated text, nothing else — no preamble, no quotes.\n\nText:\n${text}`,
  );
}

/** Translates only the visible text inside an HTML email, leaving every tag,
 *  attribute, and inline style untouched — so a Canva export keeps its exact
 *  layout across languages. */
export async function translateHtml(html: string, targetLanguage: "fr" | "zh"): Promise<string> {
  const languageName = targetLanguage === "fr" ? "French" : "Mandarin Chinese";
  return complete(
    `Translate only the human-readable text content inside the following HTML email into ${languageName}. Preserve every HTML tag, attribute, inline style, and the overall structure exactly as written — do not add, remove, or reorder any markup, and don't translate text inside attributes like alt or href unless it's plainly a caption meant for readers. Keep the tone warm and personal, matching how a couple would write to their own wedding guests. Output the complete HTML with the translated text, nothing else — no preamble, no code fences, no explanation.\n\nHTML:\n${html}`,
    8192,
  );
}

export async function rewriteText(text: string, instruction: string): Promise<string> {
  return complete(
    `${instruction} This is text for a wedding website addressed to guests. Only output the rewritten text, nothing else — no preamble, no quotes.\n\nText:\n${text}`,
  );
}
