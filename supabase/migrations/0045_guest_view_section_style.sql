-- Per-section look: a full-width coloured band with decorative artwork pinned to its
-- edges (e.g. florals exported from Canva) and an optional fade-in on scroll.
alter table guest_view_sections
  add column bg_color text,
  add column decor jsonb not null default '[]'::jsonb,
  add column fade_in boolean not null default false;
