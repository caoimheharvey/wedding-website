-- Categories become admin-editable (an "Add Category" button on Planning)
-- instead of a fixed set, so they need to be rows, not a Postgres enum.
create table wedding_categories (
  id text primary key,
  label text not null,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

insert into wedding_categories (id, label, order_index) values
  ('venue', 'Venue', 0),
  ('catering', 'Catering', 1),
  ('flowers_decor', 'Flowers & Decor', 2),
  ('photography', 'Photography', 3),
  ('videography', 'Videography', 4),
  ('music_entertainment', 'Music & Entertainment', 5),
  ('officiant', 'Officiant', 6),
  ('attire', 'Attire', 7),
  ('hair_makeup', 'Hair & Makeup', 8),
  ('stationery', 'Stationery', 9),
  ('cake_desserts', 'Cake & Desserts', 10),
  ('favors', 'Favors & Gifts', 11),
  ('transportation', 'Transportation & Travel', 12),
  ('jewelry', 'Jewelry & Rings', 13),
  ('other', 'Miscellaneous', 14);

alter table vendors alter column category type text using category::text;
alter table vendors add constraint vendors_category_fkey
  foreign key (category) references wedding_categories(id);

alter table budget_items alter column category type text using category::text;
alter table budget_items add constraint budget_items_category_fkey
  foreign key (category) references wedding_categories(id);

drop type wedding_category;

alter table wedding_categories enable row level security;

-- All access goes through the server-side service-role client (Server
-- Actions), so no policies grant access to the anon/authenticated roles.
