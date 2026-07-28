import Link from "next/link";
import { notFound } from "next/navigation";
import { getDestinationById } from "@/lib/destinations/queries";
import { DestinationForm } from "../../_components/destination-form";

export default async function EditDestinationPage({
  params,
}: {
  params: Promise<{ destinationId: string }>;
}) {
  const { destinationId } = await params;
  const destination = await getDestinationById(destinationId);
  if (!destination) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/destination" className="text-sm text-aegean hover:underline">
          ← Back to destinations
        </Link>
        <h1 className="mt-2 font-display text-2xl text-ink">Edit {destination.name}</h1>
      </div>
      <DestinationForm destination={destination} />
    </div>
  );
}
