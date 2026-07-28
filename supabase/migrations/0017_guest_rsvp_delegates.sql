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
