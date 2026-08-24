alter table guests
  add column children_allowed boolean not null default false;

create table guest_children (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references guests(id) on delete cascade,
  first_name text not null,
  last_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index guest_children_guest_id_idx on guest_children (guest_id);

alter table guest_children enable row level security;

-- All access goes through the server-side service-role client (Server
-- Actions), so no policies grant access to the anon/authenticated roles.
