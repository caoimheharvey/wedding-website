create table wedding_ideas (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  order_index int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger wedding_ideas_set_updated_at
  before update on wedding_ideas
  for each row
  execute function set_updated_at();

alter table wedding_ideas enable row level security;
