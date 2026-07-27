import { listGuestViewSections } from "@/lib/guest-view/queries";
import { GuestViewManager } from "./_components/guest-view-manager";

export default async function GuestViewPage() {
  const sections = await listGuestViewSections();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl text-ink">Guest View</h1>
        <p className="text-sm text-foreground/60">
          Build the content guests see. Sections show to everyone by default, or restrict one to
          specific wedding party roles — it&apos;ll appear merged into their view, not as a
          separate &quot;extra&quot; page.
        </p>
      </div>

      <GuestViewManager sections={sections} />
    </div>
  );
}
