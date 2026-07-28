-- Budget items and vendors now share one category taxonomy, so a budget
-- category links straight through to its vendors (and vice versa) instead
-- of a fuzzy text match. Renames/merges a couple of category names in the
-- process (vendors' 'flowers' -> 'flowers_decor', to match the budget
-- side's "Flowers & Decor").
create type wedding_category as enum (
  'venue',
  'catering',
  'flowers_decor',
  'photography',
  'videography',
  'music_entertainment',
  'officiant',
  'attire',
  'hair_makeup',
  'stationery',
  'cake_desserts',
  'favors',
  'transportation',
  'jewelry',
  'other'
);

alter table vendors alter column category type wedding_category using (
  case category::text
    when 'flowers' then 'flowers_decor'
    else category::text
  end
)::wedding_category;

drop type vendor_category;

-- budget_items.category was free text; best-effort mapping onto the shared
-- enum using both the old category label and the item name (needed to
-- split former combined buckets like "Photography & Video" and "Ceremony").
alter table budget_items alter column category type wedding_category using (
  case
    when category = 'Venue' then 'venue'
    when category = 'Catering' then 'catering'
    when category = 'Flowers & Decor' then 'flowers_decor'
    when category = 'Photography & Video' and name ilike '%video%' then 'videography'
    when category = 'Photography & Video' then 'photography'
    when category = 'Attire' and (name ilike '%hair%' or name ilike '%makeup%') then 'hair_makeup'
    when category = 'Attire' then 'attire'
    when category = 'Entertainment' then 'music_entertainment'
    when category = 'Ceremony' and name ilike '%ring%' then 'jewelry'
    when category = 'Ceremony' then 'officiant'
    when category = 'Stationery' then 'stationery'
    when category = 'Travel' then 'transportation'
    when category = 'Favors' then 'favors'
    when category = 'Miscellaneous' then 'other'
    else 'other'
  end
)::wedding_category;

alter table budget_items add column is_diy boolean not null default false;
