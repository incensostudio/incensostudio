# Management app — backend wiring plan & status

_Last updated by Claude Code, 2026-09-20 (overnight)._ 

This tracks turning the new static management app (shipped from the design handoff) into a live,
Supabase-backed back-office. Work is on branch `claude/salon-management-pwa-h1deje`. **The live URL
(management.incensostudio.com) is untouched** — the deploy workflow now publishes only from `main`,
so nothing here goes live until you merge.

## ✅ Done (safe, reversible)

- **Phase 1 — app shipped.** Replaced the old React/Vite PWA with the new no-build static app
  (`management.html` + `index.html` + `assets/mgmt/*`), brought in the shared modules it needs
  (`catalog.js`, `auth.js`, `supabase.js`, `phone.js`), favicons, sample images, and the `CNAME`.
  Deploy workflow switched to a static Pages publish, **main-only**.
- **Phase 2 — additive schema** (migration `mgmt_app_additive_schema`, nothing existing touched):
  - New tables (RLS enabled, **no policies yet = locked**): `suppliers`, `purchase_orders`,
    `shifts`, `blocks`, `expenses`, `payouts`, `closes`, `audit`, `web_gallery`, `web_space`,
    `web_pages`.
  - New columns: `web_products` (`cost, sku, low, image_url, category, descr`), `web_staff`
    (`phone, days, start_hour, end_hour, commission, time_off, services`).
  - `ref_counters` gained a `PO` row for `next_ref('PO')`.
  - Storage bucket **`studio`** (public) created for product/staff/gallery/QR images.

The app still runs on its localStorage prototype store (`assets/mgmt/data.js`) — fully clickable on
the branch for review. Swapping that store for Supabase is Phase 3.

## ⛔ Decisions needed before Phase 3 (they touch real client data — not doing these unattended)

The prototype's data shapes don't match the live DB, and there are **two of some things**:

1. **Clients vs profiles.** The DB has `clients` (old management table, ~35 real clients:
   `name, phone, instagram, tiktok, note, visits, spend, last_visit`) **and** `profiles` (website
   accounts from phone sign-in: `name, phone, email, tier, spend_12mo, birthday`). The new app has
   one "clients" list with `tags, newsletter, blocked, photo, no_shows, birthday, email, tier`.
   **Decide:** make `profiles` the single client record (migrate the 35 `clients` into it, add the
   missing columns) — recommended — or keep `clients` as walk-ins/no-account and read both.
2. **Bookings vs appointments.** The DB has `bookings` (website: `user_id, services jsonb, date,
   time, start_min, mins, pay/paid/due/gift, extra[] top-ups, status, final…`) **and**
   `appointments` (old management model: `client_id, service_name, staff_id, date, time, stage…`).
   The new app models bookings exactly like the website's `bookings` (top-ups array, settle→final).
   **Decide:** run the app on `bookings` (unify with the site) — recommended — and migrate/retire
   `appointments`.
3. **Desk sign-in.** `desk_users` is currently the OLD passcode shape (`auth_user_id, passcode_hash,
   auth_secret…`). The new app signs in with the site's WhatsApp OTP (`IncensoAuth`) then looks the
   number up in `desk_users` for `modules[]` + `flags`. **Provide:** the real sign-in **phone
   numbers** for the owner + each desk/chair user, and confirm we replace passcode auth with
   OTP + `desk_users(phone, name, role, staff, modules[], flags jsonb, active)`.

## Phase 3 sequence (once the 3 decisions are in)

1. Reshape `desk_users` to the new model; seed the owner (and staff) rows from the phones you give;
   wire `app.js` sign-in gate: after `IncensoAuth` OTP, load the `desk_users` row → modules + flags;
   refuse numbers not present/inactive; remove the prototype's fake code + avatar switcher.
2. Rewrite `assets/mgmt/data.js` as a **Supabase-backed cache**, keeping the exact public surface
   (`IncensoMgmt.db.<table>`, `save()`, `log()`, `nextRef()`, `shiftFor()`, `setShift()`, `on/off`,
   helpers). Hydrate all collections on load; `save()` upserts the changed rows with field mapping
   (app camelCase ↔ DB snake_case; booking `start` timestamp ↔ `date`+`start_min`; staff name ↔
   `web_staff`; client id ↔ profile id). `log()` → `audit`.
3. RLS policies on the new + shared tables keyed to desk identity (via `is_desk()` on the OTP user);
   Storage write policy for desk users on the `studio` bucket.
4. Wire mutating actions module by module (Today/booking → Bookings → Clients → Orders/POS → Gifts →
   Products → Supply → Staff/Services → Money → Reports → Messages → Settings), reusing the
   customer-site `send_wa` + approved `incenso_*` templates for the WhatsApp messages (numbers per
   MESSAGES.md).
5. Point `/book` availability at `shiftFor` (rota) on the customer site.
6. Reconcile the HANDOFF-CONTRACT (customer repo) with anything that changed.

## Notes
- Old `supabase/functions/desk-auth` (passcode) stays until sign-in is switched to OTP, then retire.
- `web_config` is key/value — settings map to keys, not columns.
