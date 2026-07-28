import { listWeddingIdeas } from "@/lib/ideas/queries";
import { IdeasSection } from "./_components/ideas-section";

export default async function PlanningIdeasPage() {
  const ideas = await listWeddingIdeas();
  return <IdeasSection ideas={ideas} />;
}
