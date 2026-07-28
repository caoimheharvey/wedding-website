import { PlanningSubNav } from "./_components/planning-sub-nav";

export default function PlanningLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <PlanningSubNav />
      {children}
    </div>
  );
}
