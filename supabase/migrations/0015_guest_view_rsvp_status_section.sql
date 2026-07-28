-- Lets the per-guest RSVP status summary be placed as an optional Guest View
-- section instead of being hardcoded on every guest page.
alter table guest_view_sections drop constraint guest_view_sections_type_check;
alter table guest_view_sections add constraint guest_view_sections_type_check
  check (type in ('text', 'embed_group', 'rsvp', 'image_group', 'contact_info', 'rsvp_status'));
