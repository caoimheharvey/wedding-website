alter table site_settings add column total_budget numeric(10, 2);

create table budget_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  budgeted_amount numeric(10, 2) not null default 0,
  actual_amount numeric(10, 2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger budget_items_set_updated_at
  before update on budget_items
  for each row
  execute function set_updated_at();

alter table budget_items enable row level security;

-- All access goes through the server-side service-role client (Server
-- Actions), so no policies grant access to the anon/authenticated roles.

-- Starter checklist covering common destination-wedding categories. Amounts
-- are left at 0 — better to have the couple fill in real numbers than to
-- guess at ones that imply false precision.
insert into budget_items (name, category, budgeted_amount, actual_amount) values
  ('Venue rental', 'Venue', 0, 0),
  ('Catering & bar', 'Catering', 0, 0),
  ('Photography', 'Photography & Video', 0, 0),
  ('Videography', 'Photography & Video', 0, 0),
  ('Wedding attire', 'Attire', 0, 0),
  ('Hair & makeup', 'Attire', 0, 0),
  ('Flowers & decor', 'Flowers & Decor', 0, 0),
  ('Music / DJ or band', 'Entertainment', 0, 0),
  ('Officiant', 'Ceremony', 0, 0),
  ('Wedding rings', 'Ceremony', 0, 0),
  ('Invitations & stationery', 'Stationery', 0, 0),
  ('Guest travel & accommodation support', 'Travel', 0, 0),
  ('Favors & gifts', 'Favors', 0, 0),
  ('Contingency', 'Miscellaneous', 0, 0);
