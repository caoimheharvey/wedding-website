import Link from "next/link";
import type { ChecklistSummary } from "@/lib/planning/types";

export function PlanningPhaseCard({ checklist }: { checklist: ChecklistSummary }) {
  const { currentPhase, completedCount, totalCount } = checklist;
  const currentPhaseSummary = currentPhase
    ? checklist.phases.find((entry) => entry.phase.id === currentPhase.id)
    : null;
  const phaseCompleted = currentPhaseSummary?.completedCount ?? 0;
  const phaseTotal = currentPhaseSummary?.totalCount ?? 0;
  const overallPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <section className="flex flex-col gap-3 glass-card p-4">
      <header className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium tracking-wide text-foreground/50 uppercase">
          Planning phase
        </p>
        <Link href="/admin/planning" className="text-xs font-medium text-aegean hover:underline">
          View planning
        </Link>
      </header>

      {currentPhase ? (
        <>
          <div>
            <h2 className="font-display text-xl text-ink">{currentPhase.label}</h2>
            <p className="mt-1 text-sm text-foreground/60">{currentPhase.description}</p>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-sm text-ink">
              <span>
                This phase: {phaseCompleted} of {phaseTotal} done
              </span>
              <span className="font-medium text-olive">{overallPercent}% overall</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-sand">
              <div
                className="h-full rounded-full bg-olive"
                style={{ width: `${overallPercent}%` }}
              />
            </div>
          </div>
        </>
      ) : (
        <p className="text-sm text-foreground/60">
          Set your wedding date to see which planning phase you are in.
        </p>
      )}
    </section>
  );
}
