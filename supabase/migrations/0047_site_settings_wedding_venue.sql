-- Venue name (optionally linked) shown above the city on the guest site and in the calendar invite.
-- wedding_location now holds the city.
alter table site_settings
  add column wedding_venue text,
  add column wedding_venue_url text;
