import type * as z from "zod";
import type { guestFormSchema } from "./schema";
import type { Guest } from "./types";

/**
 * The fields the admin form owns. The plus-one request fields (status and
 * requested relationship) are set by the guest's own flow, so they are left
 * out here, exactly as in the Supabase update (`toGuestRow`); including them
 * made the local mock wipe them on every edit while production kept them.
 */
export function toGuestFormFields(values: z.infer<typeof guestFormSchema>) {
  return {
    firstName: values.firstName?.trim() || null,
    lastName: values.lastName?.trim() || null,
    email: values.email || null,
    phone: values.phone || null,
    wechatHandle: values.wechatHandle?.trim() || null,
    relationshipPriority: values.relationshipPriority as Guest["relationshipPriority"],
    preferredLanguage: values.preferredLanguage,
    partyRoles: values.partyRoles,
    isPlusOneOf: values.isPlusOneOf || null,
    plusOneAllowed: values.plusOneAllowed,
    childrenAllowed: values.childrenAllowed,
    invitedBy: values.invitedBy,
    rsvpDeadlineOverride: values.rsvpDeadlineOverride || null,
    rsvpStatus: values.rsvpStatus,
    notes: values.notes || null,
    dietaryRestrictions: values.dietaryRestrictions || null,
  };
}
