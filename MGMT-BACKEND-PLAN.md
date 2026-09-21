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
