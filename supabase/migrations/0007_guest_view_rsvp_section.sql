-- Lets the RSVP form be placed as a section within the Guest View content
-- flow (title + visible_to_roles only, like other sections) instead of
-- being hardcoded above/below it on the guest page.
alter table guest_view_sections drop constraint guest_view_sections_type_check;
alter table guest_view_sections add constraint guest_view_sections_type_check
  check (type in ('text', 'embed_group', 'rsvp'));
