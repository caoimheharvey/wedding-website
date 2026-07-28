import * as z from "zod";

export const categoryFormSchema = z.object({
  label: z.string().trim().min(1, { error: "Category name is required" }),
});

/** Turns a label into a stable id: lowercase, non-alphanumerics -> underscores. */
export function slugify(label: string): string {
  const slug = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return slug || "category";
}
