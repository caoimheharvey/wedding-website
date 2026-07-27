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
