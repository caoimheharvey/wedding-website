-- A campaign is now either an email or a text message.
alter table message_campaigns
  add column channel text not null default 'email' check (channel in ('email', 'sms')),
  add column body_en text,
  add column body_fr text,
  add column body_zh text;

-- Texts have no subject, HTML or sender address.
alter table message_campaigns alter column subject_en drop not null;
alter table message_campaigns alter column html_en drop not null;
alter table message_campaigns alter column from_email drop not null;

alter table message_campaigns
  add constraint message_campaigns_content_check check (
    (channel = 'email' and subject_en is not null and html_en is not null and from_email is not null)
    or (channel = 'sms' and body_en is not null)
  );

-- A recipient is reached by email or by phone, depending on the campaign.
alter table message_recipients alter column email drop not null;
alter table message_recipients
  add column phone text,
  add column provider_message_id text;

alter table message_recipients
  add constraint message_recipients_contact_check check (email is not null or phone is not null);

create index message_recipients_provider_message_id_idx on message_recipients (provider_message_id);
