export type PreferredLanguage = "en" | "fr" | "zh";

export const PREFERRED_LANGUAGE_LABELS: Record<PreferredLanguage, string> = {
  en: "English",
  fr: "French",
  zh: "Mandarin",
};

export type RelationshipPriority = 1 | 2 | 3 | 4 | 5;

export const RELATIONSHIP_PRIORITY_LABELS: Record<RelationshipPriority, string> = {
  1: "Immediate Family",
  2: "Close Friends",
  3: "Extended Family",
  4: "Friend",
  5: "Plus One",
};

export const RELATIONSHIP_PRIORITIES = [1, 2, 3, 4, 5] as const satisfies readonly RelationshipPriority[];

export type WeddingPartyRole =
  | "maid_of_honor"
  | "best_man"
  | "bridesmaid"
  | "groomsman"
  | "flower_girl"
  | "ring_bearer"
  | "officiant"
  | "usher"
  | "master_of_ceremonies"
  | "parent_of_the_couple";

export const WEDDING_PARTY_ROLE_LABELS: Record<WeddingPartyRole, string> = {
  maid_of_honor: "Maid of Honor",
  best_man: "Best Man",
  bridesmaid: "Bridesmaid",
  groomsman: "Groomsman",
  flower_girl: "Flower Girl",
  ring_bearer: "Ring Bearer",
  officiant: "Officiant",
  usher: "Usher",
  master_of_ceremonies: "Master of Ceremonies",
  parent_of_the_couple: "Parent of the Couple",
};

export const WEDDING_PARTY_ROLES = [
  "maid_of_honor",
  "best_man",
  "bridesmaid",
  "groomsman",
  "flower_girl",
  "ring_bearer",
  "officiant",
  "usher",
  "master_of_ceremonies",
  "parent_of_the_couple",
] as const satisfies readonly WeddingPartyRole[];

export type PlusOneStatus = "requested" | "approved" | "declined";

export type InvitedBy = "alexandre" | "caoimhe" | "joint";

export const INVITED_BY_LABELS: Record<InvitedBy, string> = {
  alexandre: "Alexandre",
  caoimhe: "Caoimhe",
  joint: "Both",
};

export const INVITED_BY_OPTIONS = ["alexandre", "caoimhe", "joint"] as const satisfies readonly InvitedBy[];

export type RsvpStatus = "invited" | "yes" | "no";

export const RSVP_STATUS_LABELS: Record<RsvpStatus, string> = {
  invited: "Invited",
  yes: "Yes",
  no: "No",
};

export const RSVP_STATUS_OPTIONS = ["invited", "yes", "no"] as const satisfies readonly RsvpStatus[];

export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  relationshipPriority: RelationshipPriority;
  preferredLanguage: PreferredLanguage;
  partyRoles: WeddingPartyRole[];
  isPlusOneOf: string | null;
  /** Guest id who submits this guest's RSVP. Null means they RSVP for themselves. */
  rsvpDelegateOf: string | null;
  plusOneStatus: PlusOneStatus | null;
  plusOneRequestedRelationship: string | null;
  invitedBy: InvitedBy;
  /** ISO date (YYYY-MM-DD). Overrides the site-wide default RSVP deadline for this guest only. */
  rsvpDeadlineOverride: string | null;
  rsvpStatus: RsvpStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GuestWithPlusOnes extends Guest {
  plusOnes: GuestWithPlusOnes[];
  /** Other guests whose RSVP this guest submits on behalf of. */
  rsvpDelegateFor: Guest[];
}
