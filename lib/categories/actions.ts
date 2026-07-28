"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isLocalTestMode } from "@/lib/local-test";
import { mockInsertCategory, mockListCategories } from "./mock-store";
import { listCategories } from "./queries";
import { categoryFormSchema, slugify } from "./schema";

export type CategoryActionState =
  | { errors: Record<string, string[] | undefined>; message?: string }
  | { errors?: undefined; message?: string }
  | undefined;

export async function createCategory(
  _prevState: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  await requireAdmin();

  const parsed = categoryFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };

  const existing = isLocalTestMode() ? mockListCategories() : await listCategories();
  const existingIds = new Set(existing.map((category) => category.id));

  let id = slugify(parsed.data.label);
  let suffix = 2;
  while (existingIds.has(id)) {
    id = `${slugify(parsed.data.label)}_${suffix}`;
    suffix++;
  }

  if (isLocalTestMode()) {
    mockInsertCategory(id, parsed.data.label);
  } else {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("wedding_categories")
      .insert({ id, label: parsed.data.label, order_index: existing.length });
    if (error) return { message: `Could not save category: ${error.message}` };
  }

  revalidatePath("/admin/planning");
  revalidatePath("/admin/vendors");
  return { message: "Category added." };
}
