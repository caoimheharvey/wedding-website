export interface Destination {
  id: string;
  name: string;
  location: string | null;
  description: string | null;
  estimatedCost: number | null;
  /** Assumptions behind the estimated cost (venue tier, season, catering style, etc.). */
  costRationale: string | null;
  travelNotes: string | null;
  guestCapacityNotes: string | null;
  pros: string | null;
  cons: string | null;
  notes: string | null;
  isSelected: boolean;
  createdAt: string;
  updatedAt: string;
}

/** One item in the couple's checklist of what they want from a destination. */
export interface DestinationRequirement {
  id: string;
  requirement: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}
