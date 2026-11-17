"use server";

import { requireAdmin } from "@/lib/dal";
import { translateHtml, translateText } from "@/lib/ai/translate";

export interface TranslateCampaignResult {
  subject?: string;
  html?: string;
  message?: string;
}

export async function aiTranslateCampaign(
  subject: string,
  html: string,
  targetLanguage: "fr" | "zh",
): Promise<TranslateCampaignResult> {
  await requireAdmin();

  if (!subject.trim() || !html.trim()) {
    return { message: "Write the English subject and HTML first." };
  }

  try {
    const [translatedSubject, translatedHtml] = await Promise.all([
      translateText(subject, targetLanguage),
      translateHtml(html, targetLanguage),
    ]);
    return { subject: translatedSubject, html: translatedHtml };
  } catch (error) {
    return { message: error instanceof Error ? error.message : "Translation failed." };
  }
}

export async function aiTranslateSms(
  body: string,
  targetLanguage: "fr" | "zh",
): Promise<{ body?: string; message?: string }> {
  await requireAdmin();

  if (!body.trim()) return { message: "Write the English text first." };

  try {
    return { body: await translateText(body, targetLanguage) };
  } catch (error) {
    return { message: error instanceof Error ? error.message : "Translation failed." };
  }
}
