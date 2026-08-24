import * as z from "zod";
import { INVITED_BY_OPTIONS, RSVP_STATUS_OPTIONS, WEDDING_PARTY_ROLES } from "./types";

export const guestFormSchema = z
  .object({
    firstName: z.string().trim().optional(),
    lastName: z.string().trim().optional(),
    email: z
      .union([z.email({ error: "Enter a valid email" }), z.literal("")])
      .optional(),
    phone: z.string().trim().optional(),
    wechatHandle: z.string().trim().optional(),
    relationshipPriority: z.coerce
      .number()
      .int()
      .min(1, { error: "Choose a relationship priority" })
      .max(5, { error: "Choose a relationship priority" }),
    preferredLanguage: z.enum(["en", "fr", "zh"], {
      error: "Choose a preferred language",
    }),
    partyRoles: z.array(z.enum(WEDDING_PARTY_ROLES)).default([]),
    isPlusOneOf: z.union([z.uuid(), z.literal("")]).optional(),
    plusOneAllowed: z.coerce.boolean().optional().default(false),
    rsvpDelegateIds: z.array(z.uuid()).default([]),
    invitedBy: z.enum(INVITED_BY_OPTIONS, { error: "Choose who invited this guest" }),
    rsvpDeadlineOverride: z.union([z.iso.date(), z.literal("")]).optional(),
    rsvpStatus: z.enum(RSVP_STATUS_OPTIONS).optional().default("invited"),
    notes: z.string().trim().optional(),
    dietaryRestrictions: z.string().trim().optional(),
  })
  .refine((values) => Boolean(values.firstName?.trim()) || Boolean(values.wechatHandle?.trim()), {
    error: "Enter a first name, or a WeChat handle if the guest will provide their name themselves.",
    path: ["firstName"],
  });

export type GuestFormValues = z.infer<typeof guestFormSchema>;
