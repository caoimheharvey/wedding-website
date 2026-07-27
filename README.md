# Caoimhe & Alexandre — Wedding Website

Next.js (App Router) + TypeScript + Tailwind, Supabase for data, Auth.js for
admin sign-in. Deploys to Vercel at `caoimhealexandrewedding.com`.

This phase ships the project scaffold, admin Google sign-in, and full guest
list management (`/admin/guests`). Everything else — guest-facing RSVP,
messaging, budget/vendor tracking, seating — is scoped out below under
[Roadmap](#roadmap).

## Setup

You'll need to create three things yourself (I can't create third-party
accounts on your behalf): a Supabase project, a Google OAuth client, and a
Vercel project. Once you have the values below, copy `.env.local.example` to
`.env.local` and fill them in.

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com) (the free tier is
   plenty for this).
2. In the SQL Editor, run the migration in
   [`supabase/migrations/0001_guests.sql`](supabase/migrations/0001_guests.sql).
3. In Project Settings → API, copy the **Project URL** → `SUPABASE_URL`, and
   the **service_role** secret key → `SUPABASE_SERVICE_ROLE_KEY`.
   The service-role key bypasses Row Level Security — it's only ever used
   server-side (Server Actions), never sent to the browser. Don't reuse it
   anywhere client-facing.

### 2. Google OAuth (admin sign-in)

1. In [Google Cloud Console](https://console.cloud.google.com), create a
   project (or reuse one), then go to **APIs & Services → Credentials**.
2. Configure the OAuth consent screen (External, or Internal if you use
   Google Workspace) — you and your partner are the only intended users.
3. Create an **OAuth client ID** of type "Web application".
   - Authorized redirect URI (local dev): `http://localhost:3000/api/auth/callback/google`
   - Authorized redirect URI (production): `https://caoimhealexandrewedding.com/api/auth/callback/google`
4. Copy the client ID/secret → `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`.
5. Generate `AUTH_SECRET` with `npx auth secret` (or `openssl rand -base64 32`).
6. Set `ALLOWED_ADMIN_EMAILS` to a comma-separated list of the two Google
   account emails that should have admin access — anyone else who signs in
   is rejected.

### 3. Run it locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000/admin` — you'll be redirected to sign in, and
only the emails in `ALLOWED_ADMIN_EMAILS` will get in.

#### Testing without any real accounts set up

To poke at the admin UI before you've created Supabase or Google OAuth
projects, set `LOCAL_TEST_BYPASS_AUTH=true` in `.env.local` and nothing
else. This:

- Skips Google sign-in entirely (no `AUTH_*`/`ALLOWED_ADMIN_EMAILS` needed).
- Swaps the Guests tab's data source for an in-memory mock store, seeded
  with a few sample guests (including a linked plus-one), so `/admin/guests`
  fully works — add/edit/delete, no `SUPABASE_*` vars needed. It resets
  every time the dev server restarts; nothing is persisted.

It only works when `NODE_ENV !== "production"` (hard-coded, not something an
env var can override), so it can't accidentally activate on Vercel — **never
set it there regardless**. A terracotta banner appears across the admin UI
whenever it's active, so it's never mistakable for a real signed-in session.

Once you're ready to test against real data, unset `LOCAL_TEST_BYPASS_AUTH`
and fill in the Supabase/Google vars from the sections above instead.

### 4. Deploy

1. Create a Vercel project from this repo, add all the env vars above.
2. Point `caoimhealexandrewedding.com`'s DNS at Vercel (Vercel's project
   settings → Domains will give you the exact records to add).
3. Add the production redirect URI to the Google OAuth client (step 2 above).

## Roadmap

Scoped out of this phase; each will get its own schema migration when built
rather than being guessed at upfront:

- **Guest-facing site**: phased rollout (save-the-date → RSVP → post-RSVP),
  content merged seamlessly with role-specific info (e.g. bridal party). On
  login, a guest is served content in their `preferred_language` (already
  captured in the admin Guests tab) by default, with a small EN/FR/CN tab
  always visible to switch manually — the default just saves them a click,
  it's never the only way in. Needs a guest auth mechanism — magic-link email
  (via Resend) is the likely fit, since guests won't all have Google accounts.
- **RSVP**: per-guest attendance; guests linked via `rsvp_delegate_of` default
  to that person submitting on their behalf, but this is a starting
  suggestion, not an access restriction — the guest it's actually about can
  always log in and submit/override their own RSVP directly, with no admin
  action needed to "unlock" it first. Also: plus-one requests with a
  budget-constraint warning, and a window with contact-us instructions if
  guests miss it.
- **Messaging**: templated mass email/SMS (Resend + Twilio), scheduled sends,
  per-guest language selection at send time.
- **Planning/budget**: checklist → detail → actual-cost-vs-vendor tracking,
  AI-suggested budgets, an on/off-budget percentage bar, and a way to record
  supplemental family contributions against the €10-15k budget.
- **Seating**: table layout and guest-to-seat assignment in the admin UI.
