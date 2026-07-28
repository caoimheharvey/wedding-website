# Caoimhe & Alexandre — Wedding Website

Next.js (App Router) + TypeScript + Tailwind, Supabase for data, Auth.js for
admin sign-in. Deploys to Vercel at `caoimhealexandrewedding.com`.

Built so far: admin Google sign-in, full guest list management (RSVP status
and deadlines, roles, plus-ones, RSVP delegation), seating (tables + assigning
confirmed guests), planning/budget (total budget, per-category spend, an
editable line-item checklist), a Guest View content builder (text and
embed sections, restrictable to specific wedding-party roles, with optional
AI-assisted translation/rewriting), and real guest sign-in + RSVP submission
(magic-link email or an instant "name + phone/email" quick sign-in, both
landing on the guest's actual personalized view at the site root, `/`) — see
[Guest sign-in](#4-guest-sign-in-resend) below. See [Roadmap](#roadmap) for
what's left.

## Setup

You'll need to create these yourself (I can't create third-party accounts on
your behalf): a Supabase project, a Google OAuth client, a Vercel project,
and optionally an Anthropic API key. Once you have the values below, copy
`.env.local.example` to `.env.local` and fill them in.

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com) (the free tier is
   plenty for this).
2. In the SQL Editor, run each file in
   [`supabase/migrations/`](supabase/migrations) **in order** (`0001` through
   `0014`). `0008` also creates a public `guest-view-images` Storage bucket
   for the Guest View image sections — no separate Storage setup needed.
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

### 3. Anthropic API key (optional)

Powers the "AI: translate" / "AI: tighten wording" buttons in the Guest View
section editor. Get one at [console.anthropic.com](https://console.anthropic.com)
→ `ANTHROPIC_API_KEY`. Without it, those buttons just show an error — nothing
else depends on it.

### 4. Guest sign-in (Resend)

Guests sign in at `/guest/sign-in` one of two ways:

- **Quick sign-in**: name + the email or phone number already on their guest
  record, matched instantly and signed in for 12 hours. No email step at
  all — this is the one to point non-technical relatives at, since it works
  the same way on a shared family device without anyone needing to check an
  inbox.
- **Magic link**: emailed a one-time sign-in link (30-minute expiry to
  click, then a 30-day session once used). Needs Resend:
  1. Create a free account at [resend.com](https://resend.com) and grab an
     API key → `RESEND_API_KEY`.
  2. `RESEND_FROM_EMAIL` can stay unset — it defaults to Resend's shared test
     sender (`onboarding@resend.dev`), which works without verifying your own
     domain. Verify `caoimhealexandrewedding.com` in Resend and set this once
     you want emails to come from your own domain instead.
  3. Set `NEXT_PUBLIC_SITE_URL` to wherever the site is reachable (defaults to
     `http://localhost:3000`) — it's used to build the link guests click.

Without `RESEND_API_KEY` set, the magic-link option will error when used, but
quick sign-in works regardless — it doesn't touch Resend at all.

### 5. Run it locally

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
- Swaps every tab's data source for in-memory mock data (25 sample guests,
  two seating tables, a starter budget checklist, two Guest View sections),
  so the whole admin UI works with no `SUPABASE_*` vars needed. It resets
  every time the dev server restarts (and on some hot-reloads in dev);
  nothing is persisted.
- Lets you exercise real guest sign-in without Resend configured: requesting
  a magic link shows it directly in the `/guest/sign-in` page instead of
  emailing it. Quick sign-in (name + phone/email) always works this way,
  Resend or not.
- Unlocks a "Preview" link per guest row in the admin Guests list
  (`/guest/[guestId]`) that renders exactly what that guest would see,
  without needing to actually sign in as them.

It only works when `NODE_ENV !== "production"` (hard-coded, not something an
env var can override), so it can't accidentally activate on Vercel — **never
set it there regardless**. A terracotta banner appears across the admin UI
whenever it's active, so it's never mistakable for a real signed-in session.

Once you're ready to test against real data, unset `LOCAL_TEST_BYPASS_AUTH`
and fill in the Supabase/Google vars from the sections above instead.

### 6. Deploy

1. Create a Vercel project from this repo, add all the env vars above.
2. Point `caoimhealexandrewedding.com`'s DNS at Vercel (Vercel's project
   settings → Domains will give you the exact records to add).
3. Add the production redirect URI to the Google OAuth client (step 2 above).

## Roadmap

Scoped out so far; each will get its own schema migration when built rather
than being guessed at upfront:

- **Plus-one requests**: guests currently can't request a plus-one from the
  guest-facing side — `plus_one_status`/`plus_one_requested_relationship`
  exist and are admin-settable, but there's no guest-facing request flow
  (with a budget-constraint warning) on top of them yet.
- **Messaging**: templated mass email/SMS (Resend + Twilio), scheduled sends,
  per-guest language selection at send time.
