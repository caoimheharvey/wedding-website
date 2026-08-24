export interface GuestChild {
  id: string;
  /** The guest who was granted permission to bring children — not the child's own record. */
  guestId: string;
  firstName: string;
  lastName: string | null;
  createdAt: string;
  updatedAt: string;
}
