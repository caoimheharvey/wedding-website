-- Shortlisting is separate from (and non-exclusive, unlike) is_selected:
-- multiple destinations can be shortlisted at once as candidates worth
-- contacting vendors/planners about, before narrowing down to one selection.
alter table destinations add column is_shortlisted boolean not null default false;

-- Lightweight outreach tracker shown once a destination is shortlisted.
alter table destinations add column outreach_contacted boolean not null default false;
alter table destinations add column outreach_contacted_date date;
alter table destinations add column outreach_quotes_received boolean not null default false;
alter table destinations add column outreach_notes text;
