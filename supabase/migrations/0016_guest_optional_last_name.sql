-- Plus-ones and other guests may not have a last name on file yet; guests can
-- supply one through the Contact Info section on the guest site.
alter table guests alter column last_name drop not null;
