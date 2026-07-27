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
