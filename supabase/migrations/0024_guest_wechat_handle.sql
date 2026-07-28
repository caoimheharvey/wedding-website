-- WeChat handle as an alternate guest sign-in identifier. Some guests sign in
-- with just a WeChat handle rather than name + contact info, and won't have a
-- name on file until they complete onboarding — so first_name can no longer
-- be guaranteed not null.
alter table guests add column wechat_handle text;
create unique index guests_wechat_handle_key on guests (wechat_handle) where wechat_handle is not null;

alter table guests alter column first_name drop not null;
