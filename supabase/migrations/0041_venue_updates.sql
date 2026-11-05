-- Each reply, visit, call or note about a venue is its own dated entry, so
-- a venue can build up over several back-and-forths. `venue_details` keeps
-- holding the latest known answers; `changes` records what each entry moved.
create table venue_updates (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors(id) on delete cascade,
  kind text not null check (kind in ('reply', 'visit', 'call', 'note')),
  occurred_on date not null default current_date,
  raw_text text,
  changes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index venue_updates_vendor_id_idx on venue_updates (vendor_id);

alter table venue_updates enable row level security;

-- All access goes through the server-side service-role client (Server
-- Actions), so no policies grant access to the anon/authenticated roles.

-- The single pasted reply per venue becomes the first log entry.
insert into venue_updates (vendor_id, kind, occurred_on, raw_text)
select vendor_id, 'reply', coalesce(reply_received_date, updated_at::date), reply_text
from venue_details
where reply_text is not null;

alter table venue_details drop column reply_text;
alter table venue_details drop column reply_received_date;
