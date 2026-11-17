import Link from "next/link";
import { notFound } from "next/navigation";
import { getVendorById } from "@/lib/vendors/queries";
import { listCategories } from "@/lib/categories/queries";
import { listDestinations } from "@/lib/destinations/queries";
import { getVenueDetails, listVenueDocuments, listVenueUpdates } from "@/lib/venues/queries";
import { ASSUMPTIONS } from "@/lib/venues/analysis/assumptions";
import { buildDecisionData } from "@/lib/venues/analysis/decision";
import { loadVenueDecisionInputs } from "@/lib/venues/analysis/load";
import { defaultProfile } from "@/lib/venues/costs/defaults";
import { VendorForm } from "../../_components/vendor-form";
import { CostBreakdownEditor } from "../../_components/cost-breakdown-editor";
import { ServicesChecklistEditor } from "../../_components/services-checklist-editor";
import { VenueDetailsEditor } from "../../_components/venue-details-editor";
import { VenueDocuments } from "../../_components/venue-documents";
import { VenueExclusions } from "../../_components/venue-exclusions";
import { VenueHistory } from "../../_components/venue-history";
import { VenueProfileEditor } from "../../_components/venue-profile-editor";
import { VenueRatingsEditor } from "../../_components/venue-ratings-editor";
import { VenueScenarios } from "../../_components/venue-scenarios";
import { VenueSectionNav } from "../../_components/venue-section-nav";

function Heading({ title, hint }: { title: string; hint?: string }) {
  return (
    <div>
      <h2 className="font-display text-xl text-ink">{title}</h2>
      {hint && <p className="text-sm text-foreground/60">{hint}</p>}
    </div>
  );
}

export default async function EditVendorPage({
  params,
}: {
  params: Promise<{ category: string; vendorId: string }>;
}) {
  const { category, vendorId } = await params;

  const [vendor, categories, destinations] = await Promise.all([
    getVendorById(vendorId),
    listCategories(),
    listDestinations(),
  ]);
  const categoryLabel = categories.find((c) => c.id === category)?.label;
  if (!categoryLabel || !vendor || vendor.category !== category) notFound();
  const selectedDestinationId = destinations.find((d) => d.isSelected)?.id ?? null;
  const isVenue = category === "venue";
  const [venueDetails, venueDocuments, venueUpdates, decisionInputs] = isVenue
    ? await Promise.all([
        getVenueDetails(vendorId),
        listVenueDocuments(vendorId),
        listVenueUpdates(vendorId),
        loadVenueDecisionInputs(),
      ])
    : [null, [], [], []];
  const today = new Date().toISOString().slice(0, 10);

  // Analysed alongside every other venue so cost-vs-cheapest is like-for-like.
  const decision = isVenue ? buildDecisionData(decisionInputs, ASSUMPTIONS.adults) : null;
  const venue = decisionInputs.find((input) => input.vendorId === vendorId) ?? null;
  const analysis = decision?.analyses.find((entry) => entry.vendorId === vendorId) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={`/admin/vendors/${category}`} className="text-sm text-aegean hover:underline">
          ← Back to {categoryLabel}
        </Link>
        <h1 className="mt-2 font-display text-2xl text-ink">Edit {vendor.name}</h1>
      </div>
      {isVenue && <VenueSectionNav />}
      <section id="s1" className="flex flex-col gap-3">
        {isVenue && <Heading title="1. Venue overview" />}
        <VendorForm
          category={category}
          vendor={vendor}
          destinations={destinations}
          selectedDestinationId={selectedDestinationId}
        />
      </section>
      {isVenue && venue && analysis && (
        <>
          <hr className="border-border" />
          <section id="s2" className="flex flex-col gap-3">
            <div id="s12" />
            <Heading
              title="2. Availability, booking status, contract and quoted facts"
              hint="The original venue details form (availability, capacity, hire fee, bar, catering, coordination, rooms, deposit, payment terms and cancellation, which also covers sections 12 and 4–5 as the venue stated them). Nothing here was changed or moved."
            />
            <VenueDetailsEditor
              // Remount after each save so "was: …" hints and the update box reset
              // against the newly saved values.
              key={`${venueDetails?.updatedAt ?? "new"}-${venueUpdates.length}`}
              vendorId={vendorId}
              category={category}
              details={venueDetails}
              today={today}
            />
          </section>

          <hr className="border-border" />
          <section className="flex flex-col gap-3">
            <Heading
              title="3, 9, 11 & 15. Spaces, guest logistics, dog policy, how sure we are, and questions"
              hint="New structured facts for the comparison."
            />
            <VenueProfileEditor
              key={JSON.stringify(venue.profile)}
              vendorId={vendorId}
              category={category}
              profile={venue.profile ?? defaultProfile(vendorId)}
            />
          </section>

          <hr className="border-border" />
          <section id="s5" className="flex flex-col gap-3">
            <Heading
              title="4, 5, 8 & 10. Pricing and cost breakdown"
              hint="Food and drinks, venue and ceremony, entertainment, styling, planning and other costs, one comparable line each."
            />
            <CostBreakdownEditor
              key={JSON.stringify(venue.costItems)}
              vendorId={vendorId}
              category={category}
              items={venue.costItems}
              today={today}
            />
          </section>

          <hr className="border-border" />
          <section id="s6" className="flex flex-col gap-3">
            <Heading title="6. Included services and what the venue provides" />
            <ServicesChecklistEditor
              key={JSON.stringify(venue.services)}
              vendorId={vendorId}
              category={category}
              services={venue.services}
              costItems={venue.costItems}
              today={today}
            />
          </section>

          <section id="s7" className="flex flex-col gap-3">
            <Heading
              title="7. What this venue does NOT provide"
              hint="Generated from the services checklist: confirmed exclusions, extra-cost services, and what is still unconfirmed."
            />
            <VenueExclusions exclusions={analysis.exclusions} />
          </section>

          <hr className="border-border" />
          <section id="s13" className="flex flex-col gap-3">
            <Heading title="13. Cost scenarios" />
            <VenueScenarios analysis={analysis} />
          </section>

          <hr className="border-border" />
          <section id="s14" className="flex flex-col gap-3">
            <Heading title="14. Overall evaluation" />
            <VenueRatingsEditor
              key={JSON.stringify(venue.ratings)}
              vendorId={vendorId}
              category={category}
              ratings={venue.ratings}
              evaluationNotes={venue.profile?.evaluationNotes ?? null}
            />
            <details className="rounded-lg border border-border p-3 text-sm" open>
              <summary className="cursor-pointer text-ink">
                Outstanding questions ({analysis.questions.length})
              </summary>
              <ul className="mt-2 list-disc pl-5 text-foreground/70">
                {analysis.questions.map((question, index) => (
                  <li key={index}>
                    {question.text}
                    {question.source === "manual" && <span className="text-xs text-foreground/40"> (ours)</span>}
                  </li>
                ))}
              </ul>
            </details>
          </section>

          <hr className="border-border" />
          <section id="s16" className="flex flex-col gap-6">
            <Heading
              title="16. Original correspondence and attachments"
              hint="Every email, visit and call, with what each one changed, plus uploaded documents."
            />
            <VenueHistory updates={venueUpdates} today={today} />
            <hr className="border-border" />
            <VenueDocuments vendorId={vendorId} category={category} documents={venueDocuments} />
          </section>
        </>
      )}
    </div>
  );
}
