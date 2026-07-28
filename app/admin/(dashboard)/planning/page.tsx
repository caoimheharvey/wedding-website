import { getChecklistSummary } from "@/lib/planning/queries";
import { AddChecklistItemSection } from "./_components/add-checklist-item-section";
import { ChecklistSection } from "./_components/checklist-section";

export default async function PlanningPage() {
  const checklist = await getChecklistSummary();

  return (
    <>
      <header>
        <h1 className="font-display text-2xl text-ink">Checklist</h1>
        <p className="mt-1 text-sm text-foreground/60">
          A timeline of tasks from about two years out through the final countdown. Check items off
          as you go.
        </p>
      </header>
      <AddChecklistItemSection defaultPhaseId={checklist.currentPhase?.id ?? null} />
      <ChecklistSection checklist={checklist} />
    </>
  );
}
