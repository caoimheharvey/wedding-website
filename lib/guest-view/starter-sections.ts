import type { PreferredLanguage } from "@/lib/guests/types";

export interface StarterSection {
  title: Record<PreferredLanguage, string>;
  body: Record<PreferredLanguage, string>;
}

/** Practical-information sections for a destination wedding. Placeholder copy — meant to be
 *  edited. They are only created locally (seeded) or when the admin clicks "Add starter
 *  sections", so they never appear on the guest site by surprise. */
export const STARTER_SECTIONS: StarterSection[] = [
  {
    title: { en: "Travel & transport", fr: "Voyage et transport", zh: "交通与出行" },
    body: {
      en: "The closest airports are Seville (SVQ) and Jerez (XRY). From there it's easy to reach us by car, taxi or transfer. We'll share shuttle details and a car-hire tip soon.",
      fr: "Les aéroports les plus proches sont Séville (SVQ) et Jerez (XRY). De là, il est facile de nous rejoindre en voiture, en taxi ou en navette. Nous communiquerons bientôt les détails des navettes et un conseil pour la location de voiture.",
      zh: "最近的机场是塞维利亚（SVQ）和赫雷斯（XRY）。从机场可以乘车、打车或乘接送车前往。接送安排和租车建议稍后公布。",
    },
  },
  {
    title: { en: "Where to stay", fr: "Où loger", zh: "住宿推荐" },
    body: {
      en: "We'll suggest a few places to stay at different budgets, with their distance from the venue and booking links. Please book early — July is busy in Andalucía.",
      fr: "Nous vous proposerons quelques hébergements pour tous les budgets, avec la distance jusqu'au lieu de la cérémonie et les liens de réservation. Réservez tôt : juillet est très fréquenté en Andalousie.",
      zh: "我们会推荐几家不同价位的住宿，并注明与婚礼场地的距离和预订链接。请尽早预订——七月是安达卢西亚的旺季。",
    },
  },
  {
    title: { en: "Schedule", fr: "Programme", zh: "日程安排" },
    body: {
      en: "The full weekend schedule — welcome drinks, ceremony, reception and farewell brunch — will be shared here as soon as it's confirmed.",
      fr: "Le programme complet du week-end — apéritif de bienvenue, cérémonie, réception et brunch d'adieu — sera publié ici dès qu'il sera confirmé.",
      zh: "整个周末的完整日程——欢迎酒会、仪式、婚宴和告别早午餐——确认后会在这里公布。",
    },
  },
  {
    title: { en: "Dress code & weather", fr: "Tenue et météo", zh: "着装与天气" },
    body: {
      en: "Expect hot, sunny weather. Light fabrics and comfortable shoes are your friends, and we'll confirm the dress code closer to the date.",
      fr: "Attendez-vous à un temps chaud et ensoleillé. Privilégiez les tissus légers et des chaussures confortables ; nous confirmerons le code vestimentaire plus près de la date.",
      zh: "届时天气炎热晴朗，建议选择轻薄的面料和舒适的鞋子。着装要求将在临近日期时确认。",
    },
  },
  {
    title: { en: "Things to do", fr: "À faire sur place", zh: "游玩推荐" },
    body: {
      en: "Planning to stay a few extra days? We'll share our favourite spots — food, beaches, and the best of Seville and Cádiz.",
      fr: "Vous comptez prolonger votre séjour ? Nous partagerons nos adresses préférées : gastronomie, plages, et le meilleur de Séville et de Cadix.",
      zh: "打算多留几天吗？我们会分享我们最喜爱的去处——美食、海滩，以及塞维利亚和加的斯的精华。",
    },
  },
  {
    title: { en: "FAQ", fr: "Questions fréquentes", zh: "常见问题" },
    body: {
      en: "Questions about children, plus-ones, gifts, parking or accessibility? Answers will be collected here. If yours isn't covered, just get in touch.",
      fr: "Des questions sur les enfants, les accompagnants, les cadeaux, le parking ou l'accessibilité ? Les réponses seront rassemblées ici. Si la vôtre n'y figure pas, n'hésitez pas à nous contacter.",
      zh: "关于孩子、携伴、礼物、停车或无障碍设施的问题？答案会汇总在这里。如果没有找到您的问题，请随时联系我们。",
    },
  },
  {
    title: { en: "Gifts", fr: "Cadeaux", zh: "礼物" },
    body: {
      en: "Your presence is the best gift. If you'd like to give something, we'll share a few ideas here, such as a contribution towards our honeymoon.",
      fr: "Votre présence est le plus beau des cadeaux. Si vous souhaitez offrir quelque chose, nous partagerons ici quelques idées, comme une participation à notre voyage de noces.",
      zh: "您的到来就是最好的礼物。如果您想送点什么，我们会在这里分享一些想法，比如为我们的蜜月出一份力。",
    },
  },
];
