-- Ties a vendor to the destination it's for. Explicit while multiple
-- destinations are still being compared; once one destination is selected,
-- the app assumes new vendors belong to it without asking.
alter table vendors add column destination_id uuid references destinations(id) on delete set null;
