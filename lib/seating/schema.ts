import * as z from "zod";

export const seatingTableFormSchema = z.object({
  name: z.string().trim().min(1, { error: "Table name is required" }),
  description: z.string().trim().optional(),
});
