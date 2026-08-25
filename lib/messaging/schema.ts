import * as z from "zod";

export const composeMessageFormSchema = z.object({
  subject: z.string().trim().min(1, { error: "Subject is required" }).max(200, {
    error: "Keep the subject under 200 characters",
  }),
  html: z
    .string()
    .trim()
    .min(1, { error: "Paste the email HTML" })
    .max(500_000, { error: "That HTML is too large — keep it under 500KB" }),
  recipientIds: z
    .array(z.string())
    .min(1, { error: "Select at least one recipient" }),
  scheduledAt: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || !Number.isNaN(Date.parse(value)), {
      error: "Enter a valid date and time",
    })
    .refine((value) => !value || Date.parse(value) > Date.now(), {
      error: "Scheduled time must be in the future",
    }),
});
