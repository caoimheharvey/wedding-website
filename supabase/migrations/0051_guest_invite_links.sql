-- One personal sign-in link per guest. The token is what goes in the emailed
-- or texted URL (/i/<token>), so it is short enough for an SMS. Deleting a
-- guest's row (or the whole table) revokes their link; the next send makes a
-- new one. Kept apart from `guests` so tokens never travel with guest lists.
create table guest_invite_links (
  guest_id uuid primary key references guests(id) on delete cascade,
  token text not null unique,
  created_at timestamptz not null default now()
);

alter table guest_invite_links enable row level security;

-- All access goes through the server-side service-role client, so no policies
-- grant access to the anon/authenticated roles.
