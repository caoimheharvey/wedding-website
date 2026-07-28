export interface PlanningChecklistItem {
  id: string;
  phaseId: PlanningPhaseId;
  title: string;
  description: string | null;
  orderIndex: number;
  isComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PlanningPhaseId =
  | "vision"
  | "big_decisions"
  | "core_vendors"
  | "guest_comms"
  | "details"
  | "final_prep";

export interface PlanningPhase {
  id: PlanningPhaseId;
  label: string;
  description: string;
  /** Inclusive lower bound in months before the wedding. */
  minMonthsBefore: number;
}

export interface ChecklistPhaseSummary {
  phase: PlanningPhase;
  items: PlanningChecklistItem[];
  completedCount: number;
  totalCount: number;
}

export interface ChecklistSummary {
  phases: ChecklistPhaseSummary[];
  completedCount: number;
  totalCount: number;
  currentPhase: PlanningPhase | null;
}
