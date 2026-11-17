import "server-only";
import { revalidatePath } from "next/cache";

// MCP writes bypass the Server Actions that normally refresh the admin pages,
// so each write tool names the pages it changed and they're revalidated here.
// Without this an assistant's update can look like it didn't happen.
const vendorPaths = (category: string, id?: string) => [
  "/admin/vendors",
  `/admin/vendors/${category}`,
  ...(id ? [`/admin/vendors/${category}/${id}/edit`] : []),
];
const budgetPaths = () => ["/admin/budget", "/admin/overview"];
const checklistPaths = () => ["/admin/planning", "/admin/overview", "/admin"];

/* eslint-disable @typescript-eslint/no-explicit-any */
type PathsFor = (input: Record<string, any>, result: Record<string, any>) => string[];

export const REVALIDATION: Record<string, PathsFor> = {
  create_vendor: (_input, result) => vendorPaths(result.category, result.id),
  update_vendor: (_input, result) => vendorPaths(result.category, result.id),
  set_vendor_selected: (_input, result) => vendorPaths(result.category, result.id),
  update_booking_status: (_input, result) => vendorPaths(result.category, result.id),
  update_venue_details: (input) => vendorPaths("venue", input.vendorId),
  update_venue_costs: (input) => vendorPaths("venue", input.vendorId),
  update_venue_services: (input) => vendorPaths("venue", input.vendorId),
  update_venue_profile: (input) => vendorPaths("venue", input.vendorId),
  rate_venue: (input) => vendorPaths("venue", input.vendorId),
  set_total_budget: budgetPaths,
  add_budget_item: budgetPaths,
  update_budget_item: budgetPaths,
  add_budget_contribution: budgetPaths,
  update_budget_contribution: budgetPaths,
  add_checklist_item: checklistPaths,
  update_checklist_item: checklistPaths,
};
/* eslint-enable @typescript-eslint/no-explicit-any */

export function refreshAfterWrite(toolName: string, input: unknown, result: unknown) {
  const pathsFor = REVALIDATION[toolName];
  if (!pathsFor) return;
  for (const path of pathsFor(input as Record<string, never>, (result ?? {}) as Record<string, never>)) {
    try {
      revalidatePath(path);
    } catch {
      // Outside a request context (e.g. a script) there's nothing to refresh.
    }
  }
}
