create table venue_details (
  vendor_id uuid primary key references vendors(id) on delete cascade,
  outreach_status text not null default 'not_contacted'
    check (outreach_status in ('not_contacted', 'contacted', 'replied', 'declined')),
  reply_received_date date,
  reply_text text,
  available_dates text,
  exclusive_hire boolean,
  max_capacity integer,
  hire_hours text,
  rental_fee_saturday numeric,
  fee_includes_vat boolean not null default false,
  vat_percent numeric not null default 21,
  price_per_person numeric,
  min_spend numeric,
  min_guests integer,
  other_costs text,
  estimate_notes text,
  bar_hours_included numeric,
  extra_bar_hour_cost numeric,
  music_curfew text,
  ceremony_on_site boolean,
  setup_teardown_included boolean,
  catering_type text check (catering_type in ('in_house', 'approved_list', 'external_allowed')),
  coordination text check (coordination in ('none', 'space_only', 'full')),
  coordination_cost numeric,
  onsite_accommodation boolean,
  accommodation_notes text,
  deposit_amount numeric,
  payment_schedule text,
  cancellation_policy text,
  updated_at timestamptz not null default now()
);

create table venue_documents (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors(id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create index venue_documents_vendor_id_idx on venue_documents (vendor_id);

alter table venue_details enable row level security;
alter table venue_documents enable row level security;

-- All access goes through the server-side service-role client (Server
-- Actions), so no policies grant access to the anon/authenticated roles.

-- Private bucket: replies often include pricing, so files are served via
-- short-lived signed URLs rather than a public URL.
insert into storage.buckets (id, name, public)
values ('venue-documents', 'venue-documents', false)
on conflict (id) do nothing;
