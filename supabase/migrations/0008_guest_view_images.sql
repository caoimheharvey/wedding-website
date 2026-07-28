alter table guest_view_sections drop constraint guest_view_sections_type_check;
alter table guest_view_sections add constraint guest_view_sections_type_check
  check (type in ('text', 'embed_group', 'rsvp', 'image_group'));

create table guest_view_images (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references guest_view_sections(id) on delete cascade,
  url text not null,
  caption text,
  order_index integer not null default 0
);

create index guest_view_images_section_id_idx on guest_view_images (section_id);

alter table guest_view_images enable row level security;
-- All access goes through the server-side service-role client, same as
-- guest_view_embeds — no policies for the anon/authenticated roles.

insert into storage.buckets (id, name, public)
values ('guest-view-images', 'guest-view-images', true)
on conflict (id) do nothing;
