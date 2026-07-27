import {
  WEDDING_PARTY_ROLE_LABELS,
  WEDDING_PARTY_ROLES,
  type WeddingPartyRole,
} from "@/lib/guests/types";
import type { EffectiveRsvpStatus } from "@/lib/rsvp/status";

export type PreviewRole = "general" | WeddingPartyRole | "rsvp_delegate";

export interface PreviewPersona {
  role: PreviewRole;
  label: string;
  firstName: string;
  lastName: string;
  rsvpStatus: EffectiveRsvpStatus;
  /** Sample names, only set for the RSVP-delegate persona. */
  delegateFor?: string[];
}

const rolePersonas: PreviewPersona[] = WEDDING_PARTY_ROLES.map((role) => ({
  role,
  label: WEDDING_PARTY_ROLE_LABELS[role],
  firstName: "Sample",
  lastName: WEDDING_PARTY_ROLE_LABELS[role],
  rsvpStatus: "invited",
}));

export const PREVIEW_PERSONAS: PreviewPersona[] = [
  {
    role: "general",
    label: "General guest",
    firstName: "Alex",
    lastName: "Guest",
    rsvpStatus: "invited",
  },
  ...rolePersonas,
  {
    role: "rsvp_delegate",
    label: "RSVP delegate (RSVPs for others)",
    firstName: "Jane",
    lastName: "Doe",
    rsvpStatus: "yes",
    delegateFor: ["Jack", "John", "Mary Doe"],
  },
];

export function getPreviewPersona(role: string | undefined): PreviewPersona {
  return PREVIEW_PERSONAS.find((persona) => persona.role === role) ?? PREVIEW_PERSONAS[0];
}
