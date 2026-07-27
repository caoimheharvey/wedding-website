create table seating_tables (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger seating_tables_set_updated_at
  before update on seating_tables
  for each row
  execute function set_updated_at();

alter table guests
  add column seating_table_id uuid references seating_tables(id) on delete set null;

create index guests_seating_table_id_idx on guests (seating_table_id);

alter table seating_tables enable row level security;

-- All access goes through the server-side service-role client (Server
-- Actions), so no policies grant access to the anon/authenticated roles.
