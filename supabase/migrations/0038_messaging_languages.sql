alter table message_campaigns rename column subject to subject_en;
alter table message_campaigns rename column html to html_en;
alter table message_campaigns add column subject_fr text;
alter table message_campaigns add column html_fr text;
alter table message_campaigns add column subject_zh text;
alter table message_campaigns add column html_zh text;

alter table message_recipients add column language text not null default 'en'
  check (language in ('en', 'fr', 'zh'));
