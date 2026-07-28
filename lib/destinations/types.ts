export interface Destination {
  id: string;
  name: string;
  location: string | null;
  description: string | null;
  estimatedCost: number | null;
  travelNotes: string | null;
  guestCapacityNotes: string | null;
  pros: string | null;
  cons: string | null;
  notes: string | null;
  isSelected: boolean;
  createdAt: string;
  updatedAt: string;
}
