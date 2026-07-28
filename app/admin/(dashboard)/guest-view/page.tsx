import { listGuestViewSections } from "@/lib/guest-view/queries";
import { listGuests } from "@/lib/guests/queries";
import { isLocalTestMode } from "@/lib/local-test";
import { GuestViewManager } from "./_components/guest-view-manager";
import { PreviewPicker } from "./_components/preview-picker";

export default async function GuestViewPage() {
  const localTest = isLocalTestMode();
  const [sections, guests] = await Promise.all([
    listGuestViewSections(),
    localTest ? listGuests() : Promise.resolve([]),
  ]);

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

      {localTest && <PreviewPicker guests={guests} />}

      <GuestViewManager sections={sections} />
    </div>
  );
}
