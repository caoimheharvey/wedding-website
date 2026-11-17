-- Venue data integrity: one canonical vocabulary for dog policy (plus a
-- separate accommodation policy), a structured address, and a VAT flag that
-- can say "not stated". Existing values are mapped, nothing is dropped.

-- 1. Dog policy vocabulary: welcome | limited | not_allowed | unknown.
do $$
declare constraint_name text;
begin
  for constraint_name in
    select conname from pg_constraint
    where conrelid = 'venue_profile'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%dog_policy%'
  loop
    execute format('alter table venue_profile drop constraint %I', constraint_name);
  end loop;
end $$;

update venue_profile
set dog_policy = case dog_policy
  when 'allowed_all_day' then 'welcome'
  when 'ceremony_only' then 'limited'
  else dog_policy
end;

alter table venue_profile
  add constraint venue_profile_dog_policy_check
  check (dog_policy in ('welcome', 'limited', 'not_allowed', 'unknown'));

-- Dogs at the event and dogs in the accommodation are different questions
-- (a pet-friendly hotel says nothing about the ceremony).
alter table venue_profile
  add column dog_accommodation text not null default 'unknown'
    check (dog_accommodation in ('welcome', 'limited', 'not_allowed', 'unknown')),
  add column address text;

-- 2. VAT on the hire fee: null = not stated. It used to be NOT NULL default
-- false, which silently turned "not stated" into "VAT excluded".
alter table venue_details alter column fee_includes_vat drop not null;
alter table venue_details alter column fee_includes_vat drop default;

-- With no hire fee there is nothing for the flag to describe.
update venue_details set fee_includes_vat = null where rental_fee_saturday is null;
