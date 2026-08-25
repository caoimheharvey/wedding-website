import * as z from "zod";

const subjectField = z.string().trim().max(200, { error: "Keep the subject under 200 characters" });
const htmlField = z.string().trim().max(500_000, { error: "That HTML is too large — keep it under 500KB" });

export const composeMessageFormSchema = z.object({
  subjectEn: subjectField.min(1, { error: "Subject is required" }),
  htmlEn: htmlField.min(1, { error: "Paste the email HTML" }),
  subjectFr: subjectField.optional(),
  htmlFr: htmlField.optional(),
  subjectZh: subjectField.optional(),
  htmlZh: htmlField.optional(),
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
