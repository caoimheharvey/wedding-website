-- Per-column text bodies (jsonb string arrays) and column placement for embeds/images.
alter table guest_view_sections add column body_en_columns jsonb;
alter table guest_view_sections add column body_fr_columns jsonb;
alter table guest_view_sections add column body_zh_columns jsonb;

alter table guest_view_embeds add column column_index smallint not null default 0;
alter table guest_view_images add column column_index smallint not null default 0;
