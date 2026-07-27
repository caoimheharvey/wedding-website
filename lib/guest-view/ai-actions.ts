"use server";

import { requireAdmin } from "@/lib/dal";
import { rewriteText, translateText } from "@/lib/ai/translate";

export async function aiTranslateSection(
  text: string,
  targetLanguage: "fr" | "zh",
): Promise<{ text?: string; message?: string }> {
  await requireAdmin();

  if (!text.trim()) return { message: "Write the English text first." };

  try {
    const translated = await translateText(text, targetLanguage);
    return { text: translated };
  } catch (error) {
    return { message: error instanceof Error ? error.message : "Translation failed." };
  }
}

export async function aiRewriteSection(
  text: string,
  instruction: string,
): Promise<{ text?: string; message?: string }> {
  await requireAdmin();

  if (!text.trim()) return { message: "Write some text first." };

  try {
    const rewritten = await rewriteText(text, instruction);
    return { text: rewritten };
  } catch (error) {
    return { message: error instanceof Error ? error.message : "Rewrite failed." };
  }
}
