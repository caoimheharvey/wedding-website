create table budget_contributions (
  id uuid primary key default gen_random_uuid(),
  contributor_name text not null,
  amount numeric(10, 2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger budget_contributions_set_updated_at
  before update on budget_contributions
  for each row
  execute function set_updated_at();

alter table budget_contributions enable row level security;

-- All access goes through the server-side service-role client (Server
-- Actions), so no policies grant access to the anon/authenticated roles.
