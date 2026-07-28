import * as z from "zod";
import { WEDDING_CATEGORIES } from "@/lib/categories";

export const budgetItemFormSchema = z.object({
  name: z.string().trim().min(1, { error: "Item name is required" }),
  category: z.enum(WEDDING_CATEGORIES, { error: "Category is required" }),
  budgetedAmount: z.coerce.number().min(0, { error: "Must be zero or more" }),
  actualAmount: z.coerce.number().min(0, { error: "Must be zero or more" }),
  isDiy: z.coerce.boolean().default(false),
  notes: z.string().trim().optional(),
});
