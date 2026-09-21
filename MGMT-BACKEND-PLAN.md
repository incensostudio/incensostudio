# Management app — wiring plan & status (v3.7)

Branch `claude/salon-management-pwa-h1deje`. **Not live** — GitHub Pages deploys from `main`
only, so nothing here reaches `manage.incensostudio.com` until merged.

## Ground rules (from the studio owner)
1. **The customer website is the source of truth. Nothing on the site changes.** The
   management app manages what the site already has.
2. Where the design disagrees with the site, **the site wins** and the app is adapted
   (e.g. member levels are the site's Member / Insider / Loyal).
3. Domain: **manage.incensostudio.com**; the old **management.incensostudio.com** is deleted.
4. **Not a PWA** — a plain web app.

## Phase A — app shipped (done)
- Replaced the previous management files with the design's **v3.7** app (`management.html`
  + `assets/mgmt/*`, incl. new `v-newbooking.js`). `index.html` = the app shell so the
  domain root serves the app.
- Shared modules (`auth.js`, `catalog.js`, `supabase.js`, `phone.js`, `gift.js`) copied
  from the **live** customer site so the app speaks the live backend contract.
- Staff placeholder photos (`assets/staff/*`) and gallery images added for the prototype seed.
- PWA meta removed (plain web app). `CNAME` → `manage.incensostudio.com`.
- Spec docs vendored: `HANDOFF-CONTRACT.md`, `CHANGELOG-mgmt.md`, `MESSAGES.md`.

The app runs on its localStorage prototype store (`assets/mgmt/data.js`) — clickable for
review. Swapping that seam for Supabase is Phase B.

### DNS / Pages (owner action)
- Point `manage.incensostudio.com` (CNAME) at GitHub Pages for this repo.
- Remove the `management.incensostudio.com` DNS record so the old subdomain stops resolving.

## Phase B — Supabase wiring (next)
The one seam is `assets/mgmt/data.js` (`IncensoMgmt.db` + `save()` + helpers). Replace its
localStorage store with Supabase reads/writes, keeping the public surface. Key adaptations
so the app fits the live site without changing it:

- **Sign-in on a separate subdomain.** The design piggybacks on the site session + a
  Dashboard link on `account.html`. Across `manage.` the browser session isn't shared and
  `account.html` isn't touched, so the app gets its **own WhatsApp-OTP sign-in** (same
  `IncensoAuth`, same `desk_users` allow-list, matched by phone). `is_desk()` keys off the
  OTP user's phone.
- **Clients = profiles ∪ clients.** `profiles.id` is FK to `auth.users`, so walk-ins can't
  be profiles. The clients list merges `profiles` (site accounts) and the `clients` table
  (desk/walk-in) deduped by phone; desk-added guests are written to `clients`. No site change.
- **Shared live tables** (`bookings`, `orders`, `gift_cards`): the customer pages read them
  with their own derived vocabulary (`Awaiting payment` / `Upcoming` / `Cancelled`, pay
  **labels**, `staff` as a string, settled via `final`). The desk stores its richer state in
  **additive columns** (`desk_status`, `staff_name`, `visit`, `products`, settle fields, …)
  and writes the shared columns in the site's vocabulary, so the site keeps rendering as-is.
- **New desk data** (additive schema): `desk_users(phone,…)`, `blocks`, `expenses`,
  `income`, `payouts`, `shifts`, `suppliers`, `purchase_orders`, `supplies` (backbar),
  `audit`, `web_gallery`, `web_space`, `web_pages`, plus columns on `web_products`,
  `web_staff`, `web_config`. Finances = month ledger (`settings.openingBalance` +
  income − expenses/payouts; `fixedCosts` generate bills).
- **RLS** keyed to `is_desk()`; Storage write policy on the `studio` bucket for uploads.
- **WhatsApp** actions reuse the site's `send_wa` + approved `incenso_*` templates
  (numbers/templates per `MESSAGES.md`), from the studio number `+15554261908`.
- **Availability**: `/book` day search should read `shiftFor` (rota) — site-side follow-up.

Nothing in Phase B is destructive to the ~existing customer data; desk changes are additive
columns + upserts of rows the desk actually touches.

### Phase B status
**Done & smoke-tested (offline + mocked-online):**
- Additive v3.7 schema on the live DB: desk_users phone model + `is_desk()` by phone (owner
  +905457471711 seeded); desk columns on bookings/orders/gift_cards/clients/purchase_orders;
  new tables `supplies`, `income`; finance columns on `expenses`; RLS on everything via
  `is_desk()`; `studio` Storage bucket + upload policies; `bump_ref` RPC; upsert keys.
- `data.js` swapped to a **Supabase-backed cache**: `hydrate()` reads every collection into
  the app shapes (clients = profiles ∪ clients merged by phone); `save()` → debounced
  **snapshot-diff** write-back (upserts only rows the desk changed, deletes removed ones;
  clients never overwrite an unchanged/site-side row). Shared tables written in the site's
  vocabulary (status labels, pay labels, staff-as-string, settled-via-final) via additive
  desk columns, so the customer pages keep reading them unchanged.
- `app.js`: own WhatsApp-OTP sign-in gate for the manage subdomain (IncensoAuth + desk_users
  allow-list), hydrate-before-boot, real sign-out, prototype demo tools hidden when online.

**Follow-up items — all done:**
1. **Settings writes** — hours + studio reach the live site via `catalog.js` (studio merged so
   `reviews_uri` is preserved); other config keys persist to `web_config`; gallery/space/legal
   persist to `web_gallery`/`web_space`/`web_pages` as the studio's record (those site pages are
   static today).
2. **Services & prices / categories** — the live site already reads `web_services`/`web_categories`,
   so desk edits persist there and show on `/book` and the service pages (bigint identity handled;
   `web_categories.hero_url` added for the page image).
3. **WhatsApp sends** — delivered by the existing table triggers: the desk writes bookings/orders/
   gift_cards in the site's vocabulary, so confirmations, transfer-confirmed, settle, no-show,
   cancel, order status and gift sends message automatically. Triggers skip (never error) when a
   walk-in has no account phone. Manual "message client" uses `wa.me`.
4. **Image uploads** — `MgmtUI.imagePicker` uploads to the public `studio` bucket and stores the
   public URL (data-URL fallback offline).
5. **Card payments** — desk in-person card is marked paid; an account customer's card booking/order
   is payable via the existing site "Pay by card" button (`create-checkout` → `stripe-webhook`).
6. **/book availability** — `day_busy` now reads desk bookings (robust to string/object staff via
   `staff_name`) and desk `blocks`. (Full off-day/shift gating in `/book` is a further site step.)
7. **OTP** — `send-sms-otp` now sends the studio's `incenso_otp` from **+15554261908** (body code +
   copy-code button), with `bird_otp` (shared number) as an automatic fallback. Verified delivered
   end-to-end (Supabase Auth → hook → Bird).
8. **`incenso_booking_confirmed`** — `notify_booking_whatsapp` pay-at-studio branch now uses the
   approved studio template (vars: ref, services, staff, date, pay). Verified delivered.

Live once merged to `main`; `manage.` DNS still to be pointed by the studio.
