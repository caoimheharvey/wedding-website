import type { z } from "zod";
import type { textSectionFormSchema } from "./schema";

export function textSectionDbFields(data: z.infer<typeof textSectionFormSchema>) {
  if (data.columnCount === 1) {
    return {
      body_en: data.bodyEn ?? "",
      body_fr: data.bodyFr || null,
      body_zh: data.bodyZh || null,
      body_en_columns: null,
      body_fr_columns: null,
      body_zh_columns: null,
    };
  }

  const sliceColumns = (columns: string[] | undefined) =>
    (columns ?? []).slice(0, data.columnCount).map((value) => value.trim() || null);

  const bodyEnColumns = sliceColumns(data.bodyEnColumns);
  const bodyFrColumns = sliceColumns(data.bodyFrColumns);
  const bodyZhColumns = sliceColumns(data.bodyZhColumns);

  return {
    body_en: bodyEnColumns[0] ?? "",
    body_fr: bodyFrColumns[0] ?? null,
    body_zh: bodyZhColumns[0] ?? null,
    body_en_columns: bodyEnColumns,
    body_fr_columns: bodyFrColumns.some(Boolean) ? bodyFrColumns : null,
    body_zh_columns: bodyZhColumns.some(Boolean) ? bodyZhColumns : null,
  };
}

export function textSectionMockBody(data: z.infer<typeof textSectionFormSchema>) {
  const db = textSectionDbFields(data);
  return {
    body: {
      en: db.body_en,
      fr: db.body_fr,
      zh: db.body_zh,
    },
    bodyColumns: {
      en: (db.body_en_columns as string[] | null) ?? null,
      fr: (db.body_fr_columns as string[] | null) ?? null,
      zh: (db.body_zh_columns as string[] | null) ?? null,
    },
  };
}
