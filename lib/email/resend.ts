import "server-only";
import { Resend } from "resend";
import type { PreferredLanguage } from "@/lib/guests/types";

const STRINGS: Record<
  PreferredLanguage,
  { subject: string; greeting: (name: string) => string; body: string; cta: string }
> = {
  en: {
    subject: "Your sign-in link",
    greeting: (name) => `Hi ${name},`,
    body: "Click the link below to sign in and see your details for Caoimhe & Alexandre's wedding. It expires in 30 minutes.",
    cta: "Sign in",
  },
  fr: {
    subject: "Votre lien de connexion",
    greeting: (name) => `Bonjour ${name},`,
    body: "Cliquez sur le lien ci-dessous pour vous connecter et consulter vos informations pour le mariage de Caoimhe et Alexandre. Il expire dans 30 minutes.",
    cta: "Se connecter",
  },
  zh: {
    subject: "您的登录链接",
    greeting: (name) => `你好 ${name}，`,
    body: "点击下方链接登录，查看您在 Caoimhe & Alexandre 婚礼中的详情。链接 30 分钟后失效。",
    cta: "登录",
  },
};

function getClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY environment variable");
  }
  return new Resend(apiKey);
}

export async function sendMagicLinkEmail(
  to: string,
  firstName: string,
  link: string,
  language: PreferredLanguage,
): Promise<void> {
  const client = getClient();
  const strings = STRINGS[language];
  // Resend's shared testing sender — works without verifying a custom
  // domain. Swap in a verified address via RESEND_FROM_EMAIL once one exists.
  const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  const { error } = await client.emails.send({
    from,
    to,
    subject: strings.subject,
    html: `<p>${strings.greeting(firstName)}</p><p>${strings.body}</p><p><a href="${link}">${strings.cta}</a></p>`,
  });

  if (error) {
    throw new Error(error.message);
  }
}
