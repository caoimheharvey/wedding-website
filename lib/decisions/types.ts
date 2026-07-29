export interface WeddingDecision {
  id: string;
  title: string;
  description: string | null;
  link: string | null;
  /** ISO date (YYYY-MM-DD) the decision was made, if known. */
  decidedDate: string | null;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}
