import { listWeddingDecisions } from "@/lib/decisions/queries";
import { DecisionsSection } from "./_components/decisions-section";

export default async function PlanningDecisionsPage() {
  const decisions = await listWeddingDecisions();
  return <DecisionsSection decisions={decisions} />;
}
