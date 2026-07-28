create table destinations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text,
  description text,
  estimated_cost numeric(10, 2),
  travel_notes text,
  guest_capacity_notes text,
  pros text,
  cons text,
  notes text,
  -- Only one destination can be "the" decision at a time — enforced in the
  -- action layer (selecting one clears the flag on every other row), same
  -- pattern as vendors.is_selected.
  is_selected boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger destinations_set_updated_at
  before update on destinations
  for each row
  execute function set_updated_at();

alter table destinations enable row level security;

-- All access goes through the server-side service-role client (Server
-- Actions), so no policies grant access to the anon/authenticated roles.
