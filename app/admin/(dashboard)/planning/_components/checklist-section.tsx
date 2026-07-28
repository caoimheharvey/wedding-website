"use client";

import { useTransition } from "react";
import { setChecklistItemComplete } from "@/lib/planning/actions";
import type { ChecklistSummary } from "@/lib/planning/types";

function ChecklistItemRow({
  id,
  title,
  description,
  isComplete,
  isCurrentPhase,
}: {
  id: string;
  title: string;
  description: string | null;
  isComplete: boolean;
  isCurrentPhase: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2 transition ${
        isCurrentPhase ? "border-aegean/30 bg-aegean/5" : "border-border/60 bg-background"
      } ${isPending ? "opacity-60" : ""}`}
    >
      <input
        type="checkbox"
        checked={isComplete}
        disabled={isPending}
        onChange={(event) => {
          startTransition(async () => {
            await setChecklistItemComplete(id, event.target.checked);
          });
        }}
        className="mt-1 h-4 w-4 rounded border-border text-aegean"
      />
      <span className="flex flex-col gap-0.5 text-left">
        <span className={`text-sm ${isComplete ? "text-foreground/50 line-through" : "text-ink"}`}>
          {title}
        </span>
        {description && <span className="text-xs text-foreground/50">{description}</span>}
      </span>
    </label>
  );
}

export function ChecklistSection({ checklist }: { checklist: ChecklistSummary }) {
  const currentPhaseId = checklist.currentPhase?.id;
  const overallPercent =
    checklist.totalCount > 0
      ? Math.round((checklist.completedCount / checklist.totalCount) * 100)
      : 0;

  return (
    <article className="flex flex-col gap-6">
      <section className="rounded-lg border border-border bg-surface p-4">
        <p className="text-sm text-foreground/60">
          {checklist.completedCount} of {checklist.totalCount} tasks complete
          {checklist.currentPhase ? ` · Current phase: ${checklist.currentPhase.label}` : ""}
        </p>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-sand">
          <div
            className="h-full rounded-full bg-olive"
            style={{ width: `${overallPercent}%` }}
          />
        </div>
      </section>

      {checklist.phases.map((phaseSummary) => {
        const isCurrentPhase = phaseSummary.phase.id === currentPhaseId;

        return (
          <section key={phaseSummary.phase.id} className="flex flex-col gap-3">
            <header className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h2 className="font-display text-lg text-ink">{phaseSummary.phase.label}</h2>
                <p className="text-sm text-foreground/60">{phaseSummary.phase.description}</p>
              </div>
              <p className="text-xs text-foreground/50">
                {phaseSummary.completedCount}/{phaseSummary.totalCount} done
                {isCurrentPhase ? " · You are here" : ""}
              </p>
            </header>
            {phaseSummary.totalCount === 0 ? (
              <p className="text-sm text-foreground/40">No tasks in this stage yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {phaseSummary.items.map((item) => (
                  <ChecklistItemRow
                    key={item.id}
                    id={item.id}
                    title={item.title}
                    description={item.description}
                    isComplete={item.isComplete}
                    isCurrentPhase={isCurrentPhase}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </article>
  );
}
