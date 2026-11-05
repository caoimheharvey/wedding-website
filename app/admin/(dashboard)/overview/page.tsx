import Link from "next/link";
import { getBudgetSummary } from "@/lib/budget/queries";
import { listGuestsWithPlusOnes } from "@/lib/guests/queries";
import type { Guest } from "@/lib/guests/types";
import { getChecklistSummary } from "@/lib/planning/queries";
import { getSiteSettings } from "@/lib/rsvp/queries";
import { getEffectiveRsvpStatus, type EffectiveRsvpStatus } from "@/lib/rsvp/status";
import { GuestStats } from "../guests/_components/guest-stats";
import { CountdownCard } from "./_components/countdown-card";
import { DestinationEditor } from "./_components/destination-editor";
import { DietaryRequirementsCard } from "./_components/dietary-requirements-card";
import { OverviewBudgetCard } from "./_components/overview-budget-card";
import { PlanningPhaseCard } from "./_components/planning-phase-card";
import { WeddingDateEditor } from "./_components/wedding-date-editor";

export default async function OverviewPage() {
  const [guests, siteSettings, budget, checklist] = await Promise.all([
    listGuestsWithPlusOnes(),
    getSiteSettings(),
    getBudgetSummary(),
    getChecklistSummary(),
  ]);

  const effectiveStatusById: Record<string, EffectiveRsvpStatus> = {};

  function record(guest: Pick<Guest, "id" | "rsvpStatus" | "rsvpDeadlineOverride">) {
    effectiveStatusById[guest.id] = getEffectiveRsvpStatus(
      guest.rsvpStatus,
      guest.rsvpDeadlineOverride ?? siteSettings.defaultRsvpDeadline,
    );
  }

  for (const guest of guests) {
    record(guest);
    for (const plusOne of guest.plusOnes) {
      record(plusOne);
    }
  }

  return (
    <article className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-2xl text-ink">Overview</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Your wedding at a glance — countdown, budget, guests, and where you are in planning.
        </p>
      </header>

      <section className="glass-card p-4">
        <DestinationEditor destination={siteSettings.destination} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <CountdownCard weddingDate={siteSettings.weddingDate} />
        <section className="glass-card p-4">
          <WeddingDateEditor
            weddingDate={siteSettings.weddingDate}
            weddingLocation={siteSettings.weddingLocation}
          />
        </section>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <PlanningPhaseCard checklist={checklist} />
        <OverviewBudgetCard
          totalBudget={budget.totalBudget}
          totalContributions={budget.totalContributions}
          availableBudget={budget.availableBudget}
          totalActual={budget.totalActual}
        />
      </section>

      <section className="flex flex-col gap-3">
        <header className="flex items-center justify-between gap-2">
          <h2 className="font-display text-lg text-ink">Guest stats</h2>
          <Link href="/admin/guests" className="text-xs font-medium text-aegean hover:underline">
            Manage guests
          </Link>
        </header>
        <GuestStats guests={guests} effectiveStatusById={effectiveStatusById} />
      </section>

      <DietaryRequirementsCard guests={guests} />
    </article>
  );
}
