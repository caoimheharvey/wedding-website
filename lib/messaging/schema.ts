import * as z from "zod";
import { SMS_MAX_CHARACTERS } from "@/lib/sms/segments";

const subjectField = z.string().trim().max(200, { error: "Keep the subject under 200 characters" });
const htmlField = z.string().trim().max(500_000, { error: "That HTML is too large — keep it under 500KB" });

const recipientIdsField = z.array(z.string()).min(1, { error: "Select at least one recipient" });

const scheduledAtField = z
  .string()
  .trim()
  .optional()
  .refine((value) => !value || !Number.isNaN(Date.parse(value)), {
    error: "Enter a valid date and time",
  })
  .refine((value) => !value || Date.parse(value) > Date.now(), {
    error: "Scheduled time must be in the future",
  });

const smsBodyField = z
  .string()
  .trim()
  .max(SMS_MAX_CHARACTERS, { error: `Keep each text under ${SMS_MAX_CHARACTERS} characters` });

export const composeMessageFormSchema = z.object({
  subjectEn: subjectField.min(1, { error: "Subject is required" }),
  htmlEn: htmlField.min(1, { error: "Paste the email HTML" }),
  subjectFr: subjectField.optional(),
  htmlFr: htmlField.optional(),
  subjectZh: subjectField.optional(),
  htmlZh: htmlField.optional(),
  recipientIds: recipientIdsField,
  scheduledAt: scheduledAtField,
});

export const composeSmsFormSchema = z.object({
  bodyEn: smsBodyField.min(1, { error: "Write the text message" }),
  bodyFr: smsBodyField.optional(),
  bodyZh: smsBodyField.optional(),
  recipientIds: recipientIdsField,
  scheduledAt: scheduledAtField,
});
