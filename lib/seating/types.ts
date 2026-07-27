import type { Guest } from "@/lib/guests/types";

export interface SeatingTable {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SeatingTableWithGuests extends SeatingTable {
  guests: Guest[];
}
