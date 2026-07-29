-- A checklist of what the couple wants from their destination (e.g. "connected
-- to an airport", "good food", "affordable") — used to steer the AI-assisted
-- destination research feature and shown alongside manually-added destinations.
create table destination_requirements (
  id uuid primary key default gen_random_uuid(),
  requirement text not null,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table destination_requirements enable row level security;

-- All access goes through the server-side service-role client (Server
-- Actions), so no policies grant access to the anon/authenticated roles.
