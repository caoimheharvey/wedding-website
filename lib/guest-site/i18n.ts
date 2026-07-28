import type { PreferredLanguage, RsvpStatus } from "@/lib/guests/types";
import type { EffectiveRsvpStatus } from "@/lib/rsvp/status";

function formatNameList(names: string[], conjunction: string): string {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} ${conjunction} ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, ${conjunction} ${names[names.length - 1]}`;
}

interface GuestSiteStrings {
  phaseLabel: string;
  greeting: (names: string[]) => string;
  yourRsvp: string;
  rsvpDeadlineLabel: (date: string) => string;
  rsvpStatusLabels: Record<EffectiveRsvpStatus, string>;
  rsvpForm: {
    heading: string;
    optionLabels: Record<RsvpStatus, string>;
    yesToAll: string;
    noToAll: string;
    submit: string;
    delegateNote: (names: string[]) => string;
  };
  contactInfoForm: {
    heading: string;
    description: string;
    linkedGuestsNote: string;
    lastNamePlaceholder: string;
    emailPlaceholder: string;
    phonePlaceholder: string;
    submit: string;
  };
  contactOnboarding: {
    heading: string;
    description: string;
    lastNamePlaceholder: string;
    emailPlaceholder: string;
    phonePlaceholder: string;
    submit: string;
  };
  countdownSection: {
    heading: string;
    unset: string;
    past: (label: string) => string;
    daysToGo: (days: number) => string;
  };
  weddingDateSection: {
    heading: string;
    unset: string;
    addToGoogle: string;
    downloadIcs: string;
    calendarDescription: string;
  };
  dietarySection: {
    heading: string;
    description: string;
    placeholder: string;
    submit: string;
    saved: string;
  };
}

export const GUEST_SITE_STRINGS: Record<PreferredLanguage, GuestSiteStrings> = {
  en: {
    phaseLabel: "Save the date",
    greeting: (names) => `Hello, ${formatNameList(names, "and")}!`,
    yourRsvp: "Your RSVP status",
    rsvpDeadlineLabel: (date) => `Please respond by ${date}.`,
    rsvpStatusLabels: {
      invited: "Please let us know below",
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
      yesToAll: "Yes to all",
      noToAll: "No to all",
      submit: "Submit RSVP",
      delegateNote: (names: string[]) =>
      names.length === 1
        ? `${names[0]} can also handle this for you, but you can submit it yourself too.`
        : `${formatNameList(names, "or")} can also handle this for you, but you can submit it yourself too.`,
    },
    contactInfoForm: {
      heading: "Stay in the loop",
      description:
        "If you're RSVPing for someone else, check and update their contact details below.",
      linkedGuestsNote:
        "These are guests linked to you as a plus-one or whose RSVP you handle.",
      lastNamePlaceholder: "Last name",
      emailPlaceholder: "Email address",
      phonePlaceholder: "Mobile number",
      submit: "Save details",
    },
    contactOnboarding: {
      heading: "One more step",
      description:
        "We don't have an email or phone number for you yet. Add at least one so we can reach you — then you'll see everything else.",
      lastNamePlaceholder: "Last name",
      emailPlaceholder: "Email address",
      phonePlaceholder: "Mobile number",
      submit: "Continue",
    },
    countdownSection: {
      heading: "Countdown",
      unset: "Our wedding date will be announced soon.",
      past: (label) => `Our wedding was ${label}.`,
      daysToGo: (days) => `${days} days to go`,
    },
    weddingDateSection: {
      heading: "Wedding date",
      unset: "Our wedding date will be announced soon.",
      addToGoogle: "Add to Google Calendar",
      downloadIcs: "Add to calendar (.ics)",
      calendarDescription: "Caoimhe & Alexandre's wedding",
    },
    dietarySection: {
      heading: "Dietary requirements",
      description: "Let us know about allergies, intolerances, or anything we should plan for.",
      placeholder: "e.g. Vegetarian, nut allergy, gluten-free",
      submit: "Save dietary details",
      saved: "Dietary details saved.",
    },
  },
  fr: {
    phaseLabel: "Réservez la date",
    greeting: (names) => `Bonjour, ${formatNameList(names, "et")} !`,
    yourRsvp: "Votre statut de réponse",
    rsvpDeadlineLabel: (date) => `Merci de répondre avant le ${date}.`,
    rsvpStatusLabels: {
      invited: "Merci de répondre ci-dessous",
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
      yesToAll: "Oui pour tous",
      noToAll: "Non pour tous",
      submit: "Envoyer la réponse",
    delegateNote: (names: string[]) =>
      names.length === 1
        ? `${names[0]} peut aussi s'en occuper pour vous, mais vous pouvez répondre vous-même.`
        : `${formatNameList(names, "ou")} peuvent aussi s'en occuper pour vous, mais vous pouvez répondre vous-même.`,
    },
    contactInfoForm: {
      heading: "Restez informé·e",
      description:
        "Si vous répondez pour quelqu'un d'autre, vérifiez et mettez à jour ses coordonnées ci-dessous.",
      linkedGuestsNote:
        "Ces invités sont liés à vous en tant qu'accompagnant·e ou dont vous gérez la réponse.",
      lastNamePlaceholder: "Nom de famille",
      emailPlaceholder: "Adresse email",
      phonePlaceholder: "Numéro de téléphone",
      submit: "Enregistrer",
    },
    contactOnboarding: {
      heading: "Encore une étape",
      description:
        "Nous n'avons pas encore votre email ou numéro de téléphone. Ajoutez-en au moins un pour que nous puissions vous joindre — vous verrez ensuite le reste du site.",
      lastNamePlaceholder: "Nom de famille",
      emailPlaceholder: "Adresse email",
      phonePlaceholder: "Numéro de téléphone",
      submit: "Continuer",
    },
    countdownSection: {
      heading: "Compte à rebours",
      unset: "Notre date de mariage sera annoncée bientôt.",
      past: (label) => `Notre mariage était il y a ${label}.`,
      daysToGo: (days) => `${days} jours restants`,
    },
    weddingDateSection: {
      heading: "Date du mariage",
      unset: "Notre date de mariage sera annoncée bientôt.",
      addToGoogle: "Ajouter à Google Agenda",
      downloadIcs: "Ajouter au calendrier (.ics)",
      calendarDescription: "Mariage de Caoimhe et Alexandre",
    },
    dietarySection: {
      heading: "Régime alimentaire",
      description: "Indiquez allergies, intolérances ou besoins alimentaires.",
      placeholder: "ex. Végétarien, allergie aux noix, sans gluten",
      submit: "Enregistrer",
      saved: "Informations enregistrées.",
    },
  },
  zh: {
    phaseLabel: "预留日期",
    greeting: (names) => `你好，${formatNameList(names, "和")}！`,
    yourRsvp: "您的回复状态",
    rsvpDeadlineLabel: (date) => `请在 ${date} 前回复。`,
    rsvpStatusLabels: {
      invited: "请在下方回复",
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
      yesToAll: "全部出席",
      noToAll: "全部无法出席",
      submit: "提交回复",
    delegateNote: (names: string[]) =>
      names.length === 1
        ? `通常由 ${names[0]} 代为处理，但您也可以自己提交。`
        : `通常由 ${formatNameList(names, "或")} 代为处理，但您也可以自己提交。`,
    },
    contactInfoForm: {
      heading: "保持联系",
      description: "如果您代他人回复，请核对并更新下方的联系方式。",
      linkedGuestsNote: "这些是与您关联的陪同嘉宾或您代为回复的宾客。",
      lastNamePlaceholder: "姓氏",
      emailPlaceholder: "电子邮件地址",
      phonePlaceholder: "电话号码",
      submit: "保存信息",
    },
    contactOnboarding: {
      heading: "还差一步",
      description: "我们还没有您的电子邮件或电话号码。请至少填写一项以便我们与您联系，之后您即可查看其余内容。",
      lastNamePlaceholder: "姓氏",
      emailPlaceholder: "电子邮件地址",
      phonePlaceholder: "电话号码",
      submit: "继续",
    },
    countdownSection: {
      heading: "倒计时",
      unset: "婚礼日期即将公布。",
      past: (label) => `我们的婚礼已于${label}举行。`,
      daysToGo: (days) => `还有 ${days} 天`,
    },
    weddingDateSection: {
      heading: "婚礼日期",
      unset: "婚礼日期即将公布。",
      addToGoogle: "添加到 Google 日历",
      downloadIcs: "添加到日历 (.ics)",
      calendarDescription: "Caoimhe 与 Alexandre 的婚礼",
    },
    dietarySection: {
      heading: "饮食要求",
      description: "请告知过敏、忌口或其他饮食需求。",
      placeholder: "例如：素食、坚果过敏、无麸质",
      submit: "保存饮食信息",
      saved: "饮食信息已保存。",
    },
  },
};
