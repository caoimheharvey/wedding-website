-- Magic-link sign-in tokens for guests. The raw token is only ever in the
-- emailed URL — we store a hash so a DB leak can't be used to sign in as
-- anyone.
create table guest_login_tokens (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references guests(id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index guest_login_tokens_guest_id_idx on guest_login_tokens (guest_id);
create index guest_login_tokens_token_hash_idx on guest_login_tokens (token_hash);

alter table guest_login_tokens enable row level security;

-- All access goes through the server-side service-role client (Server
-- Actions), so no policies grant access to the anon/authenticated roles.
