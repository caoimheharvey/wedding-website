-- "full" = edge-to-edge, no card chrome (used for designed images exported from Canva).
alter table guest_view_sections drop constraint if exists guest_view_sections_width_check;
alter table guest_view_sections
  add constraint guest_view_sections_width_check check (width in ('normal', 'wide', 'full'));
