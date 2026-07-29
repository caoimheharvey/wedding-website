-- Documented decisions the couple has already made (e.g. "Going with a live
-- band over a DJ") — distinct from wedding_ideas (things being considered).
create table wedding_decisions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  link text,
  decided_date date,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table wedding_decisions enable row level security;

-- All access goes through the server-side service-role client (Server
-- Actions), so no policies grant access to the anon/authenticated roles.
