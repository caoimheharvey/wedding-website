create table message_campaigns (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  html text not null,
  from_email text not null,
  status text not null default 'sending' check (status in ('sending', 'sent', 'failed')),
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create table message_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references message_campaigns(id) on delete cascade,
  guest_id uuid references guests(id) on delete set null,
  email text not null,
  guest_name text,
  resend_email_id text,
  status text not null default 'queued' check (status in (
    'queued', 'sent', 'delivered', 'bounced', 'complained', 'failed', 'delayed'
  )),
  status_detail text,
  sent_at timestamptz,
  delivered_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index message_recipients_campaign_id_idx on message_recipients (campaign_id);
create index message_recipients_resend_email_id_idx on message_recipients (resend_email_id);

alter table message_campaigns enable row level security;
alter table message_recipients enable row level security;

-- All access goes through the server-side service-role client (Server
-- Actions), so no policies grant access to the anon/authenticated roles.
