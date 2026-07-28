import * as z from "zod";

export const budgetItemFormSchema = z.object({
  name: z.string().trim().min(1, { error: "Item name is required" }),
  category: z.string().trim().min(1, { error: "Category is required" }),
  budgetedAmount: z.coerce.number().min(0, { error: "Must be zero or more" }),
  actualAmount: z.coerce.number().min(0, { error: "Must be zero or more" }),
  isDiy: z.coerce.boolean().default(false),
  notes: z.string().trim().optional(),
});

export const budgetContributionFormSchema = z.object({
  contributorName: z.string().trim().min(1, { error: "Who gave this is required" }),
  amount: z.coerce.number().min(0, { error: "Must be zero or more" }),
  notes: z.string().trim().optional(),
});
