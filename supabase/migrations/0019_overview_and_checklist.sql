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

insert into planning_checklist_items (phase_id, title, description, order_index) values
  ('vision', 'Discuss wedding vision and priorities', 'Align on the feel, size, and must-haves for your day.', 1),
  ('vision', 'Set your total wedding budget', 'Decide how much you want to spend and what family may contribute.', 2),
  ('vision', 'Start a preliminary guest list', 'Draft names so you can plan capacity and budget realistically.', 3),
  ('vision', 'Research destinations and season', 'Compare locations, weather, and travel for guests.', 4),
  ('big_decisions', 'Choose and confirm your wedding date', 'Lock in the date that works for you and key guests.', 1),
  ('big_decisions', 'Select destination or venue', 'Compare options and pick where you will celebrate.', 2),
  ('big_decisions', 'Book venue or secure a date hold', 'Put down a deposit or hold so the date is yours.', 3),
  ('big_decisions', 'Begin researching key vendors', 'Start shortlists for photographer, caterer, and planner.', 4),
  ('core_vendors', 'Book photographer and videographer', 'Popular vendors book 12–18 months out.', 1),
  ('core_vendors', 'Book caterer and schedule a tasting', 'Confirm menu style and dietary options early.', 2),
  ('core_vendors', 'Book music, band, or DJ', 'Secure entertainment for ceremony and reception.', 3),
  ('core_vendors', 'Book florist', 'Share inspiration and confirm seasonal availability.', 4),
  ('core_vendors', 'Book hair and makeup', 'Trial appointments help finalize your look.', 5),
  ('core_vendors', 'Reserve guest accommodation blocks', 'Hold rooms at a preferred hotel or nearby options.', 6),
  ('guest_comms', 'Finalize guest list', 'Confirm who is invited before save-the-dates go out.', 1),
  ('guest_comms', 'Send save-the-dates', 'Give guests time to plan travel and time off.', 2),
  ('guest_comms', 'Order wedding attire', 'Allow time for fittings and alterations.', 3),
  ('guest_comms', 'Choose wedding party', 'Ask attendants and confirm roles.', 4),
  ('guest_comms', 'Start honeymoon planning', 'Book flights and stays if travelling soon after.', 5),
  ('details', 'Send formal invitations', 'Include RSVP deadline, dress code, and website link.', 1),
  ('details', 'Track RSVPs and meal choices', 'Follow up with guests who have not responded.', 2),
  ('details', 'Plan ceremony and reception timeline', 'Walk through the day with your venue or planner.', 3),
  ('details', 'Order cake and stationery details', 'Confirm flavours, signage, and place cards.', 4),
  ('details', 'Arrange wedding-day transport', 'Book cars or shuttles for the wedding party and guests.', 5),
  ('final_prep', 'Confirm final headcount with vendors', 'Share numbers for catering, seating, and favours.', 1),
  ('final_prep', 'Create seating chart', 'Assign tables for confirmed guests.', 2),
  ('final_prep', 'Final walkthrough with venue', 'Confirm layout, timing, and vendor access.', 3),
  ('final_prep', 'Pack wedding-day emergency kit', 'Safety pins, tape, pain relief, snacks, and touch-up makeup.', 4),
  ('final_prep', 'Plan rehearsal dinner', 'Confirm who attends and where it is held.', 5);
