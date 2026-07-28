-- Localized titles for text sections (English stays in title, matching body_en).
alter table guest_view_sections add column title_fr text;
alter table guest_view_sections add column title_zh text;
