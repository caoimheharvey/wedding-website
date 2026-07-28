create type vendor_category as enum (
  'venue',
  'catering',
  'flowers',
  'photography',
  'videography',
  'music_entertainment',
  'officiant',
  'attire',
  'hair_makeup',
  'stationery',
  'cake_desserts',
  'transportation',
  'other'
);

create table vendors (
  id uuid primary key default gen_random_uuid(),
  category vendor_category not null,
  name text not null,
  contact_name text,
  email text,
  phone text,
  website text,
  price_quote numeric(10, 2),
  notes text,
  -- At most one selected vendor per category — enforced in the action layer
  -- (selecting one clears the flag on any other vendor in the same
  -- category), not by a DB constraint, since Postgres partial-unique
  -- constraints on a boolean would need a "where is_selected" index anyway
  -- and the app is the only writer.
  is_selected boolean not null default false,
  deposit_paid boolean not null default false,
  deposit_amount numeric(10, 2),
  deposit_date date,
  fully_paid boolean not null default false,
  fully_paid_amount numeric(10, 2),
  fully_paid_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger vendors_set_updated_at
  before update on vendors
  for each row
  execute function set_updated_at();

create index vendors_category_idx on vendors (category);

alter table vendors enable row level security;

-- All access goes through the server-side service-role client (Server
-- Actions), so no policies grant access to the anon/authenticated roles.
