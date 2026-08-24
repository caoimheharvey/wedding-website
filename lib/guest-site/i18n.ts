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
  guestSignIn: {
    description: string;
    nameTab: string;
    wechatTab: string;
    firstNamePlaceholder: string;
    lastNamePlaceholder: string;
    contactPlaceholder: string;
    wechatPlaceholder: string;
    continue: string;
    checking: string;
    errors: {
      missingName: string;
      noMatch: string;
      contactRequired: string;
      missingWechat: string;
      wechatNoMatch: string;
    };
  };
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
    firstNamePlaceholder: string;
    lastNamePlaceholder: string;
    preferredLanguageLabel: string;
    emailPlaceholder: string;
    phonePlaceholder: string;
    submit: string;
    edit: string;
    cancel: string;
  };
  contactOnboarding: {
    heading: string;
    description: string;
    firstNamePlaceholder: string;
    lastNamePlaceholder: string;
    preferredLanguageLabel: string;
    emailPlaceholder: string;
    phonePlaceholder: string;
    submit: string;
    edit: string;
    cancel: string;
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
  addPlusOne: {
    heading: string;
    description: string;
    firstNamePlaceholder: string;
    lastNamePlaceholder: string;
    submit: string;
    saved: string;
  };
  children: {
    heading: string;
    description: string;
    firstNamePlaceholder: string;
    lastNamePlaceholder: string;
    submit: string;
    remove: string;
  };
}

export const GUEST_SITE_STRINGS: Record<PreferredLanguage, GuestSiteStrings> = {
  en: {
    phaseLabel: "Save the date",
    greeting: (names) => `Hello, ${formatNameList(names, "and")}!`,
    guestSignIn: {
      description:
        "Enter your first and last name as shown on your invitation. If we already have your email or phone number, enter that too — otherwise you'll be asked for contact details next.",
      nameTab: "Sign in with name",
      wechatTab: "Sign in with WeChat",
      firstNamePlaceholder: "First name",
      lastNamePlaceholder: "Last name",
      contactPlaceholder: "Email or phone (if we have it on file)",
      wechatPlaceholder: "WeChat handle",
      continue: "Continue",
      checking: "Checking…",
      errors: {
        missingName: "Enter your first and last name as shown on your invitation.",
        noMatch:
          "We couldn't find a match for those details. Double-check your first and last name, or ask whoever sent your invitation.",
        contactRequired: "Enter the email or phone number we have on file for you.",
        missingWechat: "Enter your WeChat handle.",
        wechatNoMatch:
          "We couldn't find that WeChat handle. Double-check it, or ask whoever sent your invitation.",
      },
    },
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
      firstNamePlaceholder: "First name",
      lastNamePlaceholder: "Last name",
      preferredLanguageLabel: "Preferred language",
      emailPlaceholder: "Email address",
      phonePlaceholder: "Mobile number",
      submit: "Save details",
      edit: "Edit guest details",
      cancel: "Cancel",
    },
    contactOnboarding: {
      heading: "One more step",
      description:
        "We're missing a few details for you. Fill these in so we can reach you — then you'll see everything else.",
      firstNamePlaceholder: "First name",
      lastNamePlaceholder: "Last name",
      preferredLanguageLabel: "Preferred language",
      emailPlaceholder: "Email address",
      phonePlaceholder: "Mobile number",
      submit: "Continue",
      edit: "Edit guest details",
      cancel: "Cancel",
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
    addPlusOne: {
      heading: "Add your plus-one",
      description: "You're welcome to bring a plus-one. Add their name below whenever you're ready.",
      firstNamePlaceholder: "Their first name",
      lastNamePlaceholder: "Their last name",
      submit: "Add plus-one",
      saved: "Thanks — we've added your plus-one!",
    },
    children: {
      heading: "Bringing children?",
      description: "You're welcome to bring your kids — add their names below.",
      firstNamePlaceholder: "Child's first name",
      lastNamePlaceholder: "Child's last name",
      submit: "Add child",
      remove: "Remove",
    },
  },
  fr: {
    phaseLabel: "Réservez la date",
    greeting: (names) => `Bonjour, ${formatNameList(names, "et")} !`,
    guestSignIn: {
      description:
        "Entrez votre prénom et votre nom tels qu'ils figurent sur votre invitation. Si nous avons déjà votre email ou votre numéro de téléphone, indiquez-le aussi — sinon nous vous demanderons vos coordonnées ensuite.",
      nameTab: "Se connecter avec un nom",
      wechatTab: "Se connecter avec WeChat",
      firstNamePlaceholder: "Prénom",
      lastNamePlaceholder: "Nom de famille",
      contactPlaceholder: "Email ou téléphone (si nous l'avons)",
      wechatPlaceholder: "Identifiant WeChat",
      continue: "Continuer",
      checking: "Vérification…",
      errors: {
        missingName: "Entrez votre prénom et votre nom tels qu'ils figurent sur votre invitation.",
        noMatch:
          "Nous n'avons pas trouvé de correspondance. Vérifiez votre prénom et votre nom, ou contactez la personne qui vous a invité·e.",
        contactRequired: "Entrez l'email ou le numéro de téléphone que nous avons pour vous.",
        missingWechat: "Entrez votre identifiant WeChat.",
        wechatNoMatch:
          "Nous n'avons pas trouvé cet identifiant WeChat. Vérifiez-le, ou contactez la personne qui vous a invité·e.",
      },
    },
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
      firstNamePlaceholder: "Prénom",
      lastNamePlaceholder: "Nom de famille",
      preferredLanguageLabel: "Langue préférée",
      emailPlaceholder: "Adresse email",
      phonePlaceholder: "Numéro de téléphone",
      submit: "Enregistrer",
      edit: "Modifier les coordonnées",
      cancel: "Annuler",
    },
    contactOnboarding: {
      heading: "Encore une étape",
      description:
        "Il nous manque quelques informations vous concernant. Complétez-les pour que nous puissions vous joindre — vous verrez ensuite le reste du site.",
      firstNamePlaceholder: "Prénom",
      lastNamePlaceholder: "Nom de famille",
      preferredLanguageLabel: "Langue préférée",
      emailPlaceholder: "Adresse email",
      phonePlaceholder: "Numéro de téléphone",
      submit: "Continuer",
      edit: "Modifier les coordonnées",
      cancel: "Annuler",
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
    addPlusOne: {
      heading: "Ajoutez votre accompagnant·e",
      description:
        "Vous pouvez venir accompagné·e. Ajoutez son nom ci-dessous quand vous serez prêt·e.",
      firstNamePlaceholder: "Son prénom",
      lastNamePlaceholder: "Son nom de famille",
      submit: "Ajouter",
      saved: "Merci — votre accompagnant·e a été ajouté·e !",
    },
    children: {
      heading: "Vous venez avec des enfants ?",
      description:
        "Vous êtes les bienvenus avec vos enfants — ajoutez leurs prénoms ci-dessous.",
      firstNamePlaceholder: "Prénom de l'enfant",
      lastNamePlaceholder: "Nom de l'enfant",
      submit: "Ajouter un enfant",
      remove: "Retirer",
    },
  },
  zh: {
    phaseLabel: "预留日期",
    greeting: (names) => `你好，${formatNameList(names, "和")}！`,
    guestSignIn: {
      description:
        "请输入邀请函上的名字和姓氏。如果我们已经有您的电子邮件或电话号码，也请一并填写——否则我们稍后会请您提供联系方式。",
      nameTab: "使用姓名登录",
      wechatTab: "使用微信登录",
      firstNamePlaceholder: "名字",
      lastNamePlaceholder: "姓氏",
      contactPlaceholder: "电子邮件或电话（如果我们已有记录）",
      wechatPlaceholder: "微信号",
      continue: "继续",
      checking: "正在核对…",
      errors: {
        missingName: "请输入邀请函上的名字和姓氏。",
        noMatch: "未能找到匹配的信息，请检查您的姓名，或联系邀请您的人。",
        contactRequired: "请输入我们记录中您的电子邮件或电话号码。",
        missingWechat: "请输入您的微信号。",
        wechatNoMatch: "未能找到该微信号，请检查后重试，或联系邀请您的人。",
      },
    },
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
      firstNamePlaceholder: "名字",
      lastNamePlaceholder: "姓氏",
      preferredLanguageLabel: "首选语言",
      emailPlaceholder: "电子邮件地址",
      phonePlaceholder: "电话号码",
      submit: "保存信息",
      edit: "编辑联系方式",
      cancel: "取消",
    },
    contactOnboarding: {
      heading: "还差一步",
      description: "我们还缺少您的一些信息。请填写以便我们与您联系，之后您即可查看其余内容。",
      firstNamePlaceholder: "名字",
      lastNamePlaceholder: "姓氏",
      preferredLanguageLabel: "首选语言",
      emailPlaceholder: "电子邮件地址",
      phonePlaceholder: "电话号码",
      submit: "继续",
      edit: "编辑联系方式",
      cancel: "取消",
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
    addPlusOne: {
      heading: "添加您的同行嘉宾",
      description: "您可以携伴出席。请在准备好后填写同行嘉宾的姓名。",
      firstNamePlaceholder: "对方的名字",
      lastNamePlaceholder: "对方的姓氏",
      submit: "添加同行嘉宾",
      saved: "谢谢——已为您添加同行嘉宾！",
    },
    children: {
      heading: "携带儿童？",
      description: "欢迎携带您的孩子出席——请在下方添加他们的姓名。",
      firstNamePlaceholder: "孩子的名字",
      lastNamePlaceholder: "孩子的姓氏",
      submit: "添加孩子",
      remove: "移除",
    },
  },
};
