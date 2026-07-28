import type { PreferredLanguage } from "@/lib/guests/types";
import type { GuestViewSection } from "./types";

export function padColumnTexts(values: string[], columnCount: number): string[] {
  const padded = values.slice(0, columnCount);
  while (padded.length < columnCount) padded.push("");
  return padded;
}

export function initialColumnTexts(
  section: GuestViewSection | undefined,
  language: PreferredLanguage,
  columnCount: number,
): string[] {
  const fromColumns = section?.bodyColumns?.[language];
  if (fromColumns && fromColumns.length > 0) {
    return padColumnTexts(fromColumns, columnCount);
  }

  const single = section?.body[language] ?? "";
  if (columnCount === 1) return [single];
  return padColumnTexts([single], columnCount);
}

/** Column bodies for display — falls back to legacy single body field. */
export function textSectionColumns(
  section: GuestViewSection,
  language: PreferredLanguage,
): string[] {
  const columnCount = section.columnCount ?? 1;
  const fromColumns = section.bodyColumns?.[language];
  if (fromColumns && fromColumns.some((value) => value.trim())) {
    return padColumnTexts(fromColumns, columnCount);
  }

  const fallback = section.body[language] || section.body.en;
  if (!fallback?.trim()) return [];
  return padColumnTexts([fallback], columnCount);
}

export function groupItemsByColumn<T extends { columnIndex: number }>(
  items: T[],
  columnCount: number,
): T[][] {
  const columns = Array.from({ length: columnCount }, () => [] as T[]);
  for (const item of items) {
    const index = Math.min(Math.max(item.columnIndex ?? 0, 0), columnCount - 1);
    columns[index].push(item);
  }
  return columns;
}
