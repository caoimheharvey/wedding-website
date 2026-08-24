alter table guest_view_sections
  add column width text not null default 'normal' check (width in ('normal', 'wide'));

alter table guest_view_sections
  add column text_align text not null default 'left' check (text_align in ('left', 'center'));
