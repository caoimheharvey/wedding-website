create extension if not exists "pgcrypto";

create type preferred_language as enum ('en', 'fr', 'zh');

create type wedding_party_role as enum (
  'maid_of_honor',
  'best_man',
  'bridesmaid',
  'groomsman',
  'flower_girl',
  'ring_bearer',
  'officiant',
  'usher',
  'master_of_ceremonies',
  'parent_of_the_couple'
);

create type invited_by as enum ('alexandre', 'caoimhe', 'joint');

create type rsvp_status as enum ('invited', 'yes', 'no');

create table guests (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  -- 1 Immediate Family, 2 Close Friends, 3 Extended Family, 4 Friend, 5 Plus One
  relationship_priority smallint not null check (relationship_priority between 1 and 5),
  preferred_language preferred_language not null default 'en',
  party_roles wedding_party_role[] not null default '{}',
  is_plus_one_of uuid references guests(id) on delete set null,
  -- Who submits this guest's RSVP. Null means the guest RSVPs for themselves;
  -- otherwise it's someone else's job (independent of the plus-one link above
  -- — e.g. a parent RSVPing for a relative who isn't their own plus-one).
  rsvp_delegate_of uuid references guests(id) on delete set null
    check (rsvp_delegate_of is null or rsvp_delegate_of <> id),
  plus_one_status text check (plus_one_status in ('requested', 'approved', 'declined')),
  plus_one_requested_relationship text,
  invited_by invited_by not null,
  -- Overrides the site-wide default_rsvp_deadline (site_settings) for this guest only.
  rsvp_deadline_override date,
  -- Admin-recorded response. "deadline missed" is derived at read time (see
  -- lib/rsvp/status.ts), not stored — it depends on today's date and the
  -- applicable deadline, both of which can change after the fact.
  rsvp_status rsvp_status not null default 'invited',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index guests_is_plus_one_of_idx on guests (is_plus_one_of);
create index guests_rsvp_delegate_of_idx on guests (rsvp_delegate_of);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger guests_set_updated_at
  before update on guests
  for each row
  execute function set_updated_at();

alter table guests enable row level security;

-- All access goes through the server-side service-role client (Server
-- Actions), so no policies grant access to the anon/authenticated roles.
