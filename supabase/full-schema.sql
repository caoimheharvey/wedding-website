-- >>> supabase/migrations/0001_guests.sql
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


-- >>> supabase/migrations/0002_site_settings.sql
-- Singleton table for site-wide settings. Enforced to a single row via the
-- fixed id + check constraint, so the app can always UPDATE id = 1 without
-- ever needing to INSERT.
create table site_settings (
  id smallint primary key default 1 check (id = 1),
  default_rsvp_deadline date,
  updated_at timestamptz not null default now()
);

create trigger site_settings_set_updated_at
  before update on site_settings
  for each row
  execute function set_updated_at();

insert into site_settings (id) values (1);

alter table site_settings enable row level security;

-- All access goes through the server-side service-role client (Server
-- Actions), so no policies grant access to the anon/authenticated roles.


-- >>> supabase/migrations/0003_seating.sql
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


-- >>> supabase/migrations/0004_budget.sql
alter table site_settings add column total_budget numeric(10, 2);

create table budget_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  budgeted_amount numeric(10, 2) not null default 0,
  actual_amount numeric(10, 2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger budget_items_set_updated_at
  before update on budget_items
  for each row
  execute function set_updated_at();

alter table budget_items enable row level security;

-- All access goes through the server-side service-role client (Server
-- Actions), so no policies grant access to the anon/authenticated roles.

-- Starter checklist covering common destination-wedding categories. Amounts
-- are left at 0 — better to have the couple fill in real numbers than to
-- guess at ones that imply false precision.
insert into budget_items (name, category, budgeted_amount, actual_amount) values
  ('Venue rental', 'Venue', 0, 0),
  ('Catering & bar', 'Catering', 0, 0),
  ('Photography', 'Photography & Video', 0, 0),
  ('Videography', 'Photography & Video', 0, 0),
  ('Wedding attire', 'Attire', 0, 0),
  ('Hair & makeup', 'Attire', 0, 0),
  ('Flowers & decor', 'Flowers & Decor', 0, 0),
  ('Music / DJ or band', 'Entertainment', 0, 0),
  ('Officiant', 'Ceremony', 0, 0),
  ('Wedding rings', 'Ceremony', 0, 0),
  ('Invitations & stationery', 'Stationery', 0, 0),
  ('Guest travel & accommodation support', 'Travel', 0, 0),
  ('Favors & gifts', 'Favors', 0, 0),
  ('Contingency', 'Miscellaneous', 0, 0);


-- >>> supabase/migrations/0005_guest_view.sql
create table guest_view_sections (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('text', 'embed_group')),
  title text,
  order_index integer not null default 0,
  -- Empty = visible to everyone. Non-empty = only guests holding at least
  -- one of these wedding party roles see it, merged into their normal view.
  visible_to_roles wedding_party_role[] not null default '{}',
  -- Only used by 'text' sections. One field per supported guest language.
  body_en text,
  body_fr text,
  body_zh text,
  -- Only used by 'embed_group' sections.
  column_count smallint check (column_count between 1 and 4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger guest_view_sections_set_updated_at
  before update on guest_view_sections
  for each row
  execute function set_updated_at();

create index guest_view_sections_order_idx on guest_view_sections (order_index);

create table guest_view_embeds (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references guest_view_sections(id) on delete cascade,
  provider text not null check (provider in ('google_maps', 'pinterest', 'other')),
  url text not null,
  caption text,
  order_index integer not null default 0
);

create index guest_view_embeds_section_id_idx on guest_view_embeds (section_id);

alter table guest_view_sections enable row level security;
alter table guest_view_embeds enable row level security;

-- All access goes through the server-side service-role client (Server
-- Actions), so no policies grant access to the anon/authenticated roles.


-- >>> supabase/migrations/0006_guest_login_tokens.sql
-- Magic-link sign-in tokens for guests. The raw token is only ever in the
-- emailed URL — we store a hash so a DB leak can't be used to sign in as
-- anyone.
create table guest_login_tokens (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references guests(id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index guest_login_tokens_guest_id_idx on guest_login_tokens (guest_id);
create index guest_login_tokens_token_hash_idx on guest_login_tokens (token_hash);

alter table guest_login_tokens enable row level security;

-- All access goes through the server-side service-role client (Server
-- Actions), so no policies grant access to the anon/authenticated roles.


-- >>> supabase/migrations/0007_guest_view_rsvp_section.sql
-- Lets the RSVP form be placed as a section within the Guest View content
-- flow (title + visible_to_roles only, like other sections) instead of
-- being hardcoded above/below it on the guest page.
alter table guest_view_sections drop constraint guest_view_sections_type_check;
alter table guest_view_sections add constraint guest_view_sections_type_check
  check (type in ('text', 'embed_group', 'rsvp'));


-- >>> supabase/migrations/0008_guest_view_images.sql
alter table guest_view_sections drop constraint guest_view_sections_type_check;
alter table guest_view_sections add constraint guest_view_sections_type_check
  check (type in ('text', 'embed_group', 'rsvp', 'image_group'));

create table guest_view_images (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references guest_view_sections(id) on delete cascade,
  url text not null,
  caption text,
  order_index integer not null default 0
);

create index guest_view_images_section_id_idx on guest_view_images (section_id);

alter table guest_view_images enable row level security;
-- All access goes through the server-side service-role client, same as
-- guest_view_embeds — no policies for the anon/authenticated roles.

insert into storage.buckets (id, name, public)
values ('guest-view-images', 'guest-view-images', true)
on conflict (id) do nothing;


-- >>> supabase/migrations/0009_vendors.sql
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


-- >>> supabase/migrations/0010_shared_categories.sql
-- Budget items and vendors now share one category taxonomy, so a budget
-- category links straight through to its vendors (and vice versa) instead
-- of a fuzzy text match. Renames/merges a couple of category names in the
-- process (vendors' 'flowers' -> 'flowers_decor', to match the budget
-- side's "Flowers & Decor").
create type wedding_category as enum (
  'venue',
  'catering',
  'flowers_decor',
  'photography',
  'videography',
  'music_entertainment',
  'officiant',
  'attire',
  'hair_makeup',
  'stationery',
  'cake_desserts',
  'favors',
  'transportation',
  'jewelry',
  'other'
);

alter table vendors alter column category type wedding_category using (
  case category::text
    when 'flowers' then 'flowers_decor'
    else category::text
  end
)::wedding_category;

drop type vendor_category;

-- budget_items.category was free text; best-effort mapping onto the shared
-- enum using both the old category label and the item name (needed to
-- split former combined buckets like "Photography & Video" and "Ceremony").
alter table budget_items alter column category type wedding_category using (
  case
    when category = 'Venue' then 'venue'
    when category = 'Catering' then 'catering'
    when category = 'Flowers & Decor' then 'flowers_decor'
    when category = 'Photography & Video' and name ilike '%video%' then 'videography'
    when category = 'Photography & Video' then 'photography'
    when category = 'Attire' and (name ilike '%hair%' or name ilike '%makeup%') then 'hair_makeup'
    when category = 'Attire' then 'attire'
    when category = 'Entertainment' then 'music_entertainment'
    when category = 'Ceremony' and name ilike '%ring%' then 'jewelry'
    when category = 'Ceremony' then 'officiant'
    when category = 'Stationery' then 'stationery'
    when category = 'Travel' then 'transportation'
    when category = 'Favors' then 'favors'
    when category = 'Miscellaneous' then 'other'
    else 'other'
  end
)::wedding_category;

alter table budget_items add column is_diy boolean not null default false;


-- >>> supabase/migrations/0011_guest_view_contact_info_section.sql
-- Lets a "give us your contact info" prompt be placed as a Guest View
-- section, for guests who were handed the site link directly instead of
-- being emailed/texted it (so have neither an email nor phone on file yet).
alter table guest_view_sections drop constraint guest_view_sections_type_check;
alter table guest_view_sections add constraint guest_view_sections_type_check
  check (type in ('text', 'embed_group', 'rsvp', 'image_group', 'contact_info'));


-- >>> supabase/migrations/0012_budget_contributions.sql
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


-- >>> supabase/migrations/0013_destinations.sql
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


-- >>> supabase/migrations/0014_dynamic_categories.sql
-- Categories become admin-editable (an "Add Category" button on Planning)
-- instead of a fixed set, so they need to be rows, not a Postgres enum.
create table wedding_categories (
  id text primary key,
  label text not null,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

insert into wedding_categories (id, label, order_index) values
  ('venue', 'Venue', 0),
  ('catering', 'Catering', 1),
  ('flowers_decor', 'Flowers & Decor', 2),
  ('photography', 'Photography', 3),
  ('videography', 'Videography', 4),
  ('music_entertainment', 'Music & Entertainment', 5),
  ('officiant', 'Officiant', 6),
  ('attire', 'Attire', 7),
  ('hair_makeup', 'Hair & Makeup', 8),
  ('stationery', 'Stationery', 9),
  ('cake_desserts', 'Cake & Desserts', 10),
  ('favors', 'Favors & Gifts', 11),
  ('transportation', 'Transportation & Travel', 12),
  ('jewelry', 'Jewelry & Rings', 13),
  ('other', 'Miscellaneous', 14);

alter table vendors alter column category type text using category::text;
alter table vendors add constraint vendors_category_fkey
  foreign key (category) references wedding_categories(id);

alter table budget_items alter column category type text using category::text;
alter table budget_items add constraint budget_items_category_fkey
  foreign key (category) references wedding_categories(id);

drop type wedding_category;

alter table wedding_categories enable row level security;

-- All access goes through the server-side service-role client (Server
-- Actions), so no policies grant access to the anon/authenticated roles.


-- >>> supabase/migrations/0015_guest_view_rsvp_status_section.sql
-- Lets the per-guest RSVP status summary be placed as an optional Guest View
-- section instead of being hardcoded on every guest page.
alter table guest_view_sections drop constraint guest_view_sections_type_check;
alter table guest_view_sections add constraint guest_view_sections_type_check
  check (type in ('text', 'embed_group', 'rsvp', 'image_group', 'contact_info', 'rsvp_status'));


-- >>> supabase/migrations/0016_guest_optional_last_name.sql
-- Plus-ones and other guests may not have a last name on file yet; guests can
-- supply one through the Contact Info section on the guest site.
alter table guests alter column last_name drop not null;


-- >>> supabase/migrations/0017_guest_rsvp_delegates.sql
-- Plus-one links grant RSVP delegation automatically in app code; this table
-- stores additional explicit delegate relationships (many-to-many).
create table guest_rsvp_delegates (
  guest_id uuid not null references guests(id) on delete cascade,
  delegate_id uuid not null references guests(id) on delete cascade,
  primary key (guest_id, delegate_id),
  check (guest_id <> delegate_id)
);

create index guest_rsvp_delegates_delegate_id_idx on guest_rsvp_delegates (delegate_id);

insert into guest_rsvp_delegates (guest_id, delegate_id)
select id, rsvp_delegate_of
from guests
where rsvp_delegate_of is not null;

alter table guests drop column rsvp_delegate_of;
drop index if exists guests_rsvp_delegate_of_idx;

alter table guest_rsvp_delegates enable row level security;


-- >>> supabase/migrations/0018_guest_view_section_title_i18n.sql
-- Localized titles for text sections (English stays in title, matching body_en).
alter table guest_view_sections add column title_fr text;
alter table guest_view_sections add column title_zh text;


-- >>> supabase/migrations/0019_overview_and_checklist.sql
alter table site_settings add column wedding_date date;

create table planning_checklist_items (
  id uuid primary key default gen_random_uuid(),
  phase_id text not null,
  title text not null,
  description text,
  order_index int not null default 0,
  is_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger planning_checklist_items_set_updated_at
  before update on planning_checklist_items
  for each row
  execute function set_updated_at();

alter table planning_checklist_items enable row level security;


-- >>> supabase/migrations/0020_drop_guest_login_tokens.sql
drop table if exists guest_login_tokens;


-- >>> supabase/migrations/0021_wedding_ideas.sql
create table wedding_ideas (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  order_index int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger wedding_ideas_set_updated_at
  before update on wedding_ideas
  for each row
  execute function set_updated_at();

alter table wedding_ideas enable row level security;


-- >>> supabase/migrations/0022_guest_view_builtin_sections.sql
alter table site_settings add column wedding_location text;

alter table guests add column dietary_restrictions text;

alter table guest_view_sections drop constraint guest_view_sections_type_check;
alter table guest_view_sections add constraint guest_view_sections_type_check
  check (type in (
    'text',
    'embed_group',
    'rsvp',
    'image_group',
    'contact_info',
    'rsvp_status',
    'countdown',
    'wedding_date',
    'dietary_restrictions'
  ));


-- >>> supabase/migrations/0023_section_column_content.sql
alter table guest_view_sections add column body_en_columns jsonb;
alter table guest_view_sections add column body_fr_columns jsonb;
alter table guest_view_sections add column body_zh_columns jsonb;

alter table guest_view_embeds add column column_index smallint not null default 0;
alter table guest_view_images add column column_index smallint not null default 0;


-- >>> supabase/migrations/0024_guest_wechat_handle.sql
alter table guests add column wechat_handle text;
create unique index guests_wechat_handle_key on guests (wechat_handle) where wechat_handle is not null;

alter table guests alter column first_name drop not null;


-- >>> supabase/migrations/0025_destination_requirements.sql
create table destination_requirements (
  id uuid primary key default gen_random_uuid(),
  requirement text not null,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table destination_requirements enable row level security;


-- >>> supabase/migrations/0026_destination_cost_rationale.sql
alter table destinations add column cost_rationale text;


-- >>> supabase/migrations/0027_destination_shortlist_outreach.sql
alter table destinations add column is_shortlisted boolean not null default false;

alter table destinations add column outreach_contacted boolean not null default false;
alter table destinations add column outreach_contacted_date date;
alter table destinations add column outreach_quotes_received boolean not null default false;
alter table destinations add column outreach_notes text;


-- >>> supabase/migrations/0028_wedding_decisions.sql
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


-- >>> supabase/migrations/0029_vendor_destination_link.sql
alter table vendors add column destination_id uuid references destinations(id) on delete set null;


-- >>> supabase/migrations/0030_guest_plus_one_allowed.sql
alter table guests
  add column plus_one_allowed boolean not null default false;


-- >>> supabase/migrations/0031_site_settings_background_image.sql
alter table site_settings add column background_image_url text;


-- >>> supabase/migrations/0032_guest_children.sql
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


-- >>> supabase/migrations/0033_guest_view_plus_one_children_sections.sql
alter table guest_view_sections drop constraint guest_view_sections_type_check;
alter table guest_view_sections add constraint guest_view_sections_type_check
  check (type in (
    'text',
    'embed_group',
    'rsvp',
    'image_group',
    'contact_info',
    'rsvp_status',
    'countdown',
    'wedding_date',
    'dietary_restrictions',
    'plus_one',
    'children'
  ));


-- >>> supabase/migrations/0034_guest_view_width_text_align.sql
alter table guest_view_sections
  add column width text not null default 'normal' check (width in ('normal', 'wide'));

alter table guest_view_sections
  add column text_align text not null default 'left' check (text_align in ('left', 'center'));


-- >>> supabase/migrations/0035_site_settings_header_label.sql
alter table site_settings add column header_label text;

