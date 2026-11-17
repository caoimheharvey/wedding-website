# Venue data model: canonical fields and who owns what

The website database (Supabase) is the **source of truth** for every venue fact. Notion is a downstream
mirror that assistants keep in step through the MCP endpoint; it never overwrites the website
automatically. To compare a Notion page with the website, read `get_venue_record` (everything the website
stores, in one call) and `audit_venue_data` (where the record contradicts itself or only exists as text).

## Rules

1. **One fact, one field.** A fact lives in one structured field. Notes (`vendors.notes`,
   `*_notes` columns) explain, qualify and give source context; **nothing reads them**, so a fact written only
   in notes is invisible to the website. Dog policy, address, VAT, capacity and prices are fields, not notes.
2. **`unknown` is an answer.** A field is unknown until the venue (or we) said something. Unknown is never
   shown as included, excluded, free, or "excluding VAT".
3. **Vocabulary is closed.** Enums are enforced by the database (CHECK), the zod schemas and the forms alike;
   free text is rejected, not stored.
4. **Updates are partial.** Tools and services change only the fields sent; unrelated fields and notes are
   preserved.
5. **Duplicates are kept in step or reported.** Where the same fact has two homes (below) either they are
   synchronised in code or `audit_venue_data` reports drift.

## Venue facts

| Attribute | Canonical field | Type / allowed values | Written by |
|---|---|---|---|
| Dog policy at the wedding | `venue_profile.dog_policy` | `welcome` · `limited` · `not_allowed` · `unknown` | `update_venue_profile`, profile editor |
| Dogs in the accommodation | `venue_profile.dog_accommodation` | same values (a pet-friendly hotel ≠ event access) | same |
| Dog qualifications | `venue_profile.dog_notes` | text: *explains*, never decides | same |
| Address / town | `venue_profile.address`, `.location` | text | same |
| English support | `venue_profile.english_support` | `confirmed` · `partial` · `no` · `unknown` | same |
| Direct flight from Amsterdam | `venue_profile.direct_flight_amsterdam` | `yes` · `no` · `unknown` | same |
| Contact, website | `vendors.contact_name / email / phone / website` | text | `update_vendor` |
| Capacity, minimum guests, minimum spend | `venue_details.max_capacity / min_guests / min_spend` | integer / numeric, `null` = not stated (`0` minimum guests = "no minimum") | `update_venue_details`, details form |
| Exclusive hire | `venue_details.exclusive_hire` | `true` · `false` · `null` | same |
| Available dates, music curfew, hire hours | `venue_details.available_dates / music_curfew / hire_hours` | text | same |
| Hire fee | cost line `venue_hire` (mirrored to `venue_details.rental_fee_saturday`) | numeric, `null` = not priced | `update_venue_costs` or details form |
| VAT on a price | cost line `vat` (hire fee also mirrored to `venue_details.fee_includes_vat`) | `included` · `excluded` · `unknown` (flag: `true` · `false` · `null`) | same |
| Menu price per person | cost line `adult_menu` (mirrored to `venue_details.price_per_person`) | numeric per adult | same |
| Ceremony fee, DJ, flowers… | cost lines (`venue_cost_items`) | amount, basis, mandatory/optional, included/additional, VAT, source, confidence | `update_venue_costs` |
| Catering, accommodation, setup, coordination… | services checklist (`venue_services`) | `included` · `additional` · `not_provided` · `not_permitted` · `not_applicable` · `unknown` | `update_venue_services` |
| Deposit **the venue requires** | `venue_details.deposit_amount` | numeric | details form / MCP |
| Deposit / balance **actually paid** | `vendors.deposit_*`, `fully_paid_*` | amount, date, paid flag | `update_booking_status` |
| Our ratings | `venue_ratings` | 0–5 per criterion, absent = not rated | `rate_venue` |

### Not applicable vs not provided vs not yet confirmed
- **Not provided**: the venue confirmed it does not offer it (`not_provided` / `not_permitted`).
- **Not applicable**: it doesn't matter for this venue (e.g. accommodation for a day-only venue).
- **Unknown / not yet confirmed**: nobody has said; this is a question to ask, not an exclusion.

## Facts stored twice

| Pair | How it is kept consistent |
|---|---|
| hire fee, per-person price, extra bar hour, coordination cost: `venue_details` flat columns ↔ cost lines | **Synchronised both ways** (`lib/venues/sync.ts`). Cost lines are canonical; saving either side updates the other. |
| `onsite_accommodation` ↔ services `accommodation`; `setup_teardown_included` ↔ `setup`/`breakdown`; `catering_type` ↔ `catering`; `bar_hours_included` ↔ `open_bar` | **Reported, not merged**: `audit_venue_data` flags contradictions. The services checklist is the richer, preferred record. |

## Known limitations
- There is no Notion integration in the code: Notion ↔ website consistency is maintained by assistants via MCP,
  with the website authoritative. `get_venue_record` is the value a Notion page should match.
- `guests.plus_one_status` and `guests.plus_one_requested_relationship` are leftovers of an earlier plus-one
  request flow: nothing writes or shows them (always null).
- Checklist items can be completed and created in the admin UI, but edited only through MCP.

## Guard rails (tests)
`npm test` runs against a real Postgres (PGlite) with the real migrations: every database column must be read
and written by the application; every editable form/tool field must round-trip; one-field updates must not
disturb others; values must persist for a new session; migrations must keep existing venue records.
