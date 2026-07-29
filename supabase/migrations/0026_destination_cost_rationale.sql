-- Explains the assumptions behind an AI-generated cost estimate (venue tier,
-- season, catering style, guest-count basis, etc.) so it's clear why a
-- number came out the way it did, not just what the number is.
alter table destinations add column cost_rationale text;
