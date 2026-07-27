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

async function complete(prompt: string): Promise<string> {
  const client = getClient();
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });
  const block = message.content[0];
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

export async function rewriteText(text: string, instruction: string): Promise<string> {
  return complete(
    `${instruction} This is text for a wedding website addressed to guests. Only output the rewritten text, nothing else — no preamble, no quotes.\n\nText:\n${text}`,
  );
}
