-- Structured venue comparison: individually priced cost lines, a services
-- checklist, extra venue facts, and our own ratings. Purely additive:
-- venue_details, venue_updates and venue_documents are untouched, and a
-- missing row always means "unknown / unpriced", never zero.

create table venue_cost_items (
  vendor_id uuid not null references vendors(id) on delete cascade,
  item_key text not null,
  amount numeric check (amount is null or amount >= 0),
  amount_high numeric check (amount_high is null or amount_high >= 0),
  currency text not null default 'EUR',
  basis text not null default 'fixed'
    check (basis in ('fixed', 'per_adult', 'per_child', 'per_supplier', 'per_hour')),
  quantity numeric check (quantity is null or quantity >= 0),
  requirement text not null default 'mandatory' check (requirement in ('mandatory', 'optional')),
  inclusion text not null default 'additional' check (inclusion in ('included', 'additional')),
  vat text not null default 'unknown' check (vat in ('included', 'excluded', 'unknown')),
  source text check (source in ('email', 'brochure', 'quote', 'estimate', 'assumption')),
  confidence text not null default 'unknown'
    check (confidence in ('confirmed_by_venue', 'brochure', 'indicative', 'calculated', 'assumption', 'unknown')),
  source_date date,
  in_total boolean not null default true,
  scenario_override text check (scenario_override in ('minimum', 'realistic', 'complete', 'never')),
  notes text,
  updated_at timestamptz not null default now(),
  primary key (vendor_id, item_key)
);

create table venue_services (
  vendor_id uuid not null references vendors(id) on delete cascade,
  service_key text not null,
  status text not null default 'unknown'
    check (status in ('included', 'additional', 'not_provided', 'not_permitted', 'not_applicable', 'unknown')),
  cost_item_key text,
  confidence text not null default 'unknown'
    check (confidence in ('confirmed_by_venue', 'brochure', 'indicative', 'calculated', 'assumption', 'unknown')),
  source text check (source in ('email', 'brochure', 'quote', 'estimate', 'assumption')),
  source_date date,
  notes text,
  updated_at timestamptz not null default now(),
  primary key (vendor_id, service_key)
);

create table venue_profile (
  vendor_id uuid primary key references vendors(id) on delete cascade,
  location text,
  ceremony_capacity integer,
  reception_capacity integer,
  party_capacity integer,
  space_notes text,
  dog_policy text not null default 'unknown'
    check (dog_policy in ('allowed_all_day', 'ceremony_only', 'not_allowed', 'unknown')),
  dog_notes text,
  direct_flight_amsterdam text not null default 'unknown' check (direct_flight_amsterdam in ('yes', 'no', 'unknown')),
  logistics_notes text,
  english_support text not null default 'unknown' check (english_support in ('confirmed', 'partial', 'no', 'unknown')),
  evaluation_notes text,
  outstanding_questions text,
  -- Confidence / source / date for key facts that live on venue_details.
  field_meta jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Our own subjective scores. Absent = not scored, never a default.
create table venue_ratings (
  vendor_id uuid not null references vendors(id) on delete cascade,
  criterion_key text not null,
  score numeric not null check (score >= 0 and score <= 5),
  reasoning text,
  updated_at timestamptz not null default now(),
  primary key (vendor_id, criterion_key)
);

alter table venue_cost_items enable row level security;
alter table venue_services enable row level security;
alter table venue_profile enable row level security;
alter table venue_ratings enable row level security;

-- All access goes through the server-side service-role client (Server
-- Actions), so no policies grant access to the anon/authenticated roles.

-- ---------------------------------------------------------------------
-- Backfill from venue_details. Only unambiguous mappings; everything else
-- (free-text other_costs, payment schedule, curfew, hours) stays where it
-- is. Venues that have replied are marked "confirmed by venue / email" and
-- flagged for a check; the rest stay "unknown" so nothing is presented as
-- a quote that wasn't.
-- ---------------------------------------------------------------------

create temporary view _venue_reply as
select d.vendor_id,
       d.outreach_status = 'replied' as replied,
       (select max(u.occurred_on) from venue_updates u where u.vendor_id = d.vendor_id and u.kind = 'reply') as reply_date
from venue_details d;

insert into venue_cost_items (vendor_id, item_key, amount, basis, requirement, inclusion, vat, source, confidence, source_date, notes)
select d.vendor_id, 'venue_hire', d.rental_fee_saturday, 'fixed', 'mandatory', 'additional',
       case when d.fee_includes_vat then 'included' else 'excluded' end,
       case when r.replied then 'email' end,
       case when r.replied then 'confirmed_by_venue' else 'unknown' end,
       r.reply_date,
       case when r.replied then 'Migrated from the venue reply. Please verify.' end
from venue_details d join _venue_reply r using (vendor_id)
where d.rental_fee_saturday is not null
on conflict do nothing;

-- Whether a per-person price includes VAT was never recorded, so it stays unknown.
insert into venue_cost_items (vendor_id, item_key, amount, basis, requirement, inclusion, vat, source, confidence, source_date, notes)
select d.vendor_id, 'adult_menu', d.price_per_person, 'per_adult', 'mandatory', 'additional', 'unknown',
       case when r.replied then 'email' end,
       case when r.replied then 'confirmed_by_venue' else 'unknown' end,
       r.reply_date,
       case when r.replied then 'Migrated from the venue reply. VAT treatment not recorded; please verify.' end
from venue_details d join _venue_reply r using (vendor_id)
where d.price_per_person is not null
on conflict do nothing;

insert into venue_cost_items (vendor_id, item_key, amount, basis, requirement, inclusion, vat, source, confidence, source_date, notes)
select d.vendor_id, 'additional_bar_hours', d.extra_bar_hour_cost, 'per_hour', 'optional', 'additional', 'unknown',
       case when r.replied then 'email' end,
       case when r.replied then 'confirmed_by_venue' else 'unknown' end,
       r.reply_date,
       case when r.replied then 'Migrated from the venue reply. Please verify.' end
from venue_details d join _venue_reply r using (vendor_id)
where d.extra_bar_hour_cost is not null
on conflict do nothing;

insert into venue_cost_items (vendor_id, item_key, amount, basis, requirement, inclusion, vat, source, confidence, source_date, notes)
select d.vendor_id, 'wedding_coordinator', d.coordination_cost, 'fixed', 'optional', 'additional', 'unknown',
       case when r.replied then 'email' end,
       case when r.replied then 'confirmed_by_venue' else 'unknown' end,
       r.reply_date,
       case when r.replied then 'Migrated from the venue reply. Please verify.' end
from venue_details d join _venue_reply r using (vendor_id)
where d.coordination_cost is not null
on conflict do nothing;

-- Services: catering
insert into venue_services (vendor_id, service_key, status, confidence, source, source_date, notes)
select d.vendor_id, 'catering',
       case when d.catering_type = 'in_house' then 'included' else 'not_provided' end,
       case when r.replied then 'confirmed_by_venue' else 'unknown' end,
       case when r.replied then 'email' end, r.reply_date,
       'Migrated from the catering type (' || d.catering_type || '). Please verify.'
from venue_details d join _venue_reply r using (vendor_id)
where d.catering_type is not null
on conflict do nothing;

-- Services: setup and breakdown (only the "yes" is unambiguous)
insert into venue_services (vendor_id, service_key, status, confidence, source, source_date, notes)
select d.vendor_id, k.service_key, 'included',
       case when r.replied then 'confirmed_by_venue' else 'unknown' end,
       case when r.replied then 'email' end, r.reply_date,
       'Migrated from "setup & teardown included". Please verify.'
from venue_details d join _venue_reply r using (vendor_id)
cross join (values ('setup'), ('breakdown')) as k(service_key)
where d.setup_teardown_included is true
on conflict do nothing;

-- Services: on-site accommodation
insert into venue_services (vendor_id, service_key, status, confidence, source, source_date, notes)
select d.vendor_id, 'accommodation',
       case when d.onsite_accommodation then 'additional' else 'not_provided' end,
       case when r.replied then 'confirmed_by_venue' else 'unknown' end,
       case when r.replied then 'email' end, r.reply_date,
       'Migrated from "rooms on site". Please verify.'
from venue_details d join _venue_reply r using (vendor_id)
where d.onsite_accommodation is not null
on conflict do nothing;

-- Services: open bar when bar hours are included
insert into venue_services (vendor_id, service_key, status, confidence, source, source_date, notes)
select d.vendor_id, 'open_bar', 'included',
       case when r.replied then 'confirmed_by_venue' else 'unknown' end,
       case when r.replied then 'email' end, r.reply_date,
       'Migrated from "open bar hours included". Please verify.'
from venue_details d join _venue_reply r using (vendor_id)
where d.bar_hours_included > 0
on conflict do nothing;

-- Profile rows carry the confidence of the key facts that already exist.
insert into venue_profile (vendor_id, field_meta)
select d.vendor_id,
       case when r.replied then jsonb_strip_nulls(jsonb_build_object(
         'availableDates', case when d.available_dates is not null then m.meta end,
         'maxCapacity', case when d.max_capacity is not null then m.meta end,
         'minGuests', case when d.min_guests is not null then m.meta end,
         'minSpend', case when d.min_spend is not null then m.meta end,
         'hireHours', case when d.hire_hours is not null then m.meta end,
         'exclusiveHire', case when d.exclusive_hire is not null then m.meta end,
         'musicCurfew', case when d.music_curfew is not null then m.meta end,
         'coordination', case when d.coordination is not null then m.meta end,
         'vatPercent', case when d.rental_fee_saturday is not null then m.meta end,
         'depositAmount', case when d.deposit_amount is not null then m.meta end,
         'paymentSchedule', case when d.payment_schedule is not null then m.meta end,
         'cancellationPolicy', case when d.cancellation_policy is not null then m.meta end
       )) else '{}'::jsonb end
from venue_details d join _venue_reply r using (vendor_id)
cross join lateral (
  select jsonb_build_object(
    'confidence', 'confirmed_by_venue',
    'source', 'Email (migrated: please verify)',
    'date', r.reply_date
  ) as meta
) m
on conflict do nothing;

drop view _venue_reply;
