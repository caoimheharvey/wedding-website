import type { PreferredLanguage, RsvpStatus } from "@/lib/guests/types";
import type { EffectiveRsvpStatus } from "@/lib/rsvp/status";

interface GuestSiteStrings {
  phaseLabel: string;
  greeting: (firstName: string) => string;
  intro: string;
  yourRsvp: string;
  rsvpDeadlineLabel: (date: string) => string;
  rsvpStatusLabels: Record<EffectiveRsvpStatus, string>;
  rsvpForm: {
    heading: string;
    optionLabels: Record<RsvpStatus, string>;
    submit: string;
    delegateNote: (name: string) => string;
  };
}

export const GUEST_SITE_STRINGS: Record<PreferredLanguage, GuestSiteStrings> = {
  en: {
    phaseLabel: "Save the date",
    greeting: (firstName) => `Hello, ${firstName}!`,
    intro:
      "We can't wait to celebrate with you. More details will be posted here as the big day gets closer.",
    yourRsvp: "Your RSVP status",
    rsvpDeadlineLabel: (date) => `Please respond by ${date}.`,
    rsvpStatusLabels: {
      invited: "Awaiting your response",
      yes: "You're attending — see you there!",
      no: "Marked as not attending",
      deadline_missed: "The RSVP deadline has passed — please contact us",
    },
    rsvpForm: {
      heading: "Let us know if you can make it",
      optionLabels: {
        invited: "No answer yet",
        yes: "Attending",
        no: "Not attending",
      },
      submit: "Submit RSVP",
      delegateNote: (name) =>
        `${name} normally handles this for you, but you can submit it yourself too.`,
    },
  },
  fr: {
    phaseLabel: "Réservez la date",
    greeting: (firstName) => `Bonjour, ${firstName} !`,
    intro:
      "Nous avons hâte de célébrer avec vous. Plus de détails seront publiés ici à l'approche du grand jour.",
    yourRsvp: "Votre statut de réponse",
    rsvpDeadlineLabel: (date) => `Merci de répondre avant le ${date}.`,
    rsvpStatusLabels: {
      invited: "En attente de votre réponse",
      yes: "Vous serez présent — à bientôt !",
      no: "Indiqué comme absent",
      deadline_missed: "La date limite est passée — merci de nous contacter",
    },
    rsvpForm: {
      heading: "Merci de nous dire si vous pourrez venir",
      optionLabels: {
        invited: "Pas encore de réponse",
        yes: "Présent",
        no: "Absent",
      },
      submit: "Envoyer la réponse",
      delegateNote: (name) =>
        `${name} s'en occupe habituellement pour vous, mais vous pouvez aussi répondre vous-même.`,
    },
  },
  zh: {
    phaseLabel: "预留日期",
    greeting: (firstName) => `你好，${firstName}！`,
    intro: "我们迫不及待想与你一起庆祝。随着大喜之日临近，更多详情将在此公布。",
    yourRsvp: "您的回复状态",
    rsvpDeadlineLabel: (date) => `请在 ${date} 前回复。`,
    rsvpStatusLabels: {
      invited: "等待您的回复",
      yes: "您已确认出席，到时见！",
      no: "已标记为无法出席",
      deadline_missed: "回复截止日期已过，请与我们联系",
    },
    rsvpForm: {
      heading: "请告诉我们您是否能出席",
      optionLabels: {
        invited: "尚未回复",
        yes: "将出席",
        no: "无法出席",
      },
      submit: "提交回复",
      delegateNote: (name) => `通常由 ${name} 为您处理，但您也可以自己提交。`,
    },
  },
};
