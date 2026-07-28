-- Lets a "give us your contact info" prompt be placed as a Guest View
-- section, for guests who were handed the site link directly instead of
-- being emailed/texted it (so have neither an email nor phone on file yet).
alter table guest_view_sections drop constraint guest_view_sections_type_check;
alter table guest_view_sections add constraint guest_view_sections_type_check
  check (type in ('text', 'embed_group', 'rsvp', 'image_group', 'contact_info'));
