import Link from "next/link";
import { DestinationForm } from "../_components/destination-form";

export default function NewDestinationPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/destination" className="text-sm text-aegean hover:underline">
          ← Back to destinations
        </Link>
        <h1 className="mt-2 font-display text-2xl text-ink">Add destination</h1>
      </div>
      <DestinationForm />
    </div>
  );
}
