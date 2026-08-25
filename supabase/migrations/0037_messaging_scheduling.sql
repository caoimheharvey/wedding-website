alter table message_campaigns add column scheduled_at timestamptz;

alter table message_campaigns drop constraint message_campaigns_status_check;
alter table message_campaigns add constraint message_campaigns_status_check
  check (status in ('sending', 'scheduled', 'sent', 'failed', 'canceled'));

alter table message_recipients drop constraint message_recipients_status_check;
alter table message_recipients add constraint message_recipients_status_check
  check (status in (
    'queued', 'scheduled', 'sent', 'delivered', 'bounced', 'complained', 'failed', 'delayed', 'canceled'
  ));
