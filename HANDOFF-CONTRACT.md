# Incenso Studio — Design ↔ Backend Handoff Contract

**Purpose.** This is the single source of truth shared between **Claude design** (where the
site's look and prototype behaviour are built) and **Claude Code** (where the real backend —
database, sign‑in, WhatsApp, payments — is wired in and deployed). Paste this whole file into
Claude design at the start of any design session so it builds on the *latest* state and keeps
the seams stable. Claude Code keeps this file up to date in the repo after every change.

The goal: moving a change from Claude design → live site is **drop‑in**. Claude design owns the
design and describes the intended behaviour; Claude Code re‑applies the real backend at the few
documented seams. If the seams below are preserved, integration is mechanical (minutes, no
guesswork).

> **What changed since the last handoff (read first):** card payments are **live** now (Stripe
> hosted checkout); the studio's **own branded WhatsApp templates are approved** and send from the
> studio's own WhatsApp number; a booking can now carry **several separate top‑ups** (different pay
> methods) shown as their own lines; booking/order/gift view pages are **server‑authoritative and
> live‑refresh**. Details in §7, §8 and §10. None of this changes the design seams — it's mostly
> behaviour — but the payment breakdown UI (bookings especially) now renders a *list* of lines.

---

## 1. How the two sides work together

- **Claude design** produces: the full designed pages (HTML + CSS), *prototype* behaviour in
  inline `<script>` (localStorage‑based, so the page is clickable on its own), and short plain‑
  English notes on how the real backend should behave.
- **Claude Code** replaces the prototype behaviour with the real backend (Supabase + Stripe + Bird
  WhatsApp), deploys to GitHub Pages, and updates this contract.
- **Design and behaviour stay in the same page files** (we are *not* separating them). What keeps
  the handoff cheap is that the real backend attaches at a small, stable set of **seams** — keep
  those and everything re‑applies fast.

### The handoff format (what Claude design hands over)
1. The changed page file(s), full.
2. A short **"Changes since last handoff"** changelog: what changed visually, and — in plain
   English — any new or changed *behaviour*.
3. If a brand‑new data field or message is introduced, say so explicitly so Claude Code adds the
   column / template.

### Rules for Claude design (the contract)
- **Keep the design tokens** in §4 (colours, fonts). Home‑page bar colour `#f7f4eb`; every other
  page's browser theme colour `#e5dcc9`.
- **Keep the shared `<script src>` includes** (§5) and their order.
- **Keep the element hooks** the shared scripts bind to (§5): the `id`s, `data-…` attributes and
  custom tags. Restyle them, move them, rename their *labels* — but don't remove them or rename the
  hook itself.
- **A payment breakdown is a list, not a single line** (§7a). On a booking or order, render the
  payment summary as a repeatable set of rows (e.g. "$40 card", "$20 Whish Money · pending",
  "$25 OMT Pay · pending", "$15 at studio"), not one fixed field — a booking can hold multiple
  top‑ups of different methods, each its own row with its own status.
- **Don't change the home‑page lattice, its sound, the story rings, or the theme colours** unless
  explicitly asked — delicate and hand‑tuned.
- Everything else — layout, spacing, colours within a page, imagery, copy, new sections,
  animations — is yours to change freely.

---

## 2. Architecture at a glance

- **Front end:** a static site (plain HTML/CSS/JS), deployed on **GitHub Pages** at
  `incensostudio.com` (repo `incensostudio/incensostudio.github.io`, branch `main`). No build step.
  Clean URLs (no `.html`).
- **Back end:** the browser talks **directly to Supabase** (Postgres + Auth + Edge Functions +
  cron), protected by Row‑Level Security using a **public "publishable" key** (safe to ship).
- **Payments:** **Stripe Checkout** (hosted page) via two Supabase Edge Functions — the amount is
  always computed server‑side.
- **Messaging:** **Bird (MessageBird) WhatsApp** for sign‑in codes and all customer messages,
  triggered from the database, using the studio's own approved templates.
- **Separate management app** (different repo) will later read the same database. Not part of this
  site.

---

## 3. Pages & URLs

All lowercase, no `.html`. File name = URL.

| URL | File | What it is |
|---|---|---|
| `/` | `index.html` | Home — lattice hero (with sound), story rings, live Google reviews |
| `/shop` | `shop.html` | Product shop (products from the database) |
| `/hair` `/nails` `/makeup` `/brows-lashes` | same names | Service menus (per category) |
| `/book` | `book.html` | Booking flow: service → stylist → time → details → pay |
| `/work` | `work.html` | Our Work gallery |
| `/space` | `space.html` | The Space / studio |
| `/gift` | `gift.html` | Buy a gift card |
| `/gift-card` | `gift-card.html` | View a single gift card (by code) |
| `/cart` | `cart.html` | Shopping cart |
| `/checkout` | `checkout.html` | Shop checkout |
| `/account` | `account.html` | Member account: details, bookings, orders, gift balance, restocks |
| `/booking` | `booking.html` | View a single booking (by ref) |
| `/terms` `/shipping` `/privacy` | same names | Legal pages (still exist; the **home‑page footer no longer links them** — see §10) |

---

## 4. Design system (tokens)

- **Fonts:** `Geist` (sans) and `Geist Mono` (mono), from Google Fonts.
- **Colours:** `--bg-warm: #e5dcc9` (page background), `--fg-warm: #000000` (text), plus per‑page
  accent pastels. **Browser theme colour:** `#e5dcc9` on every page **except home**, which uses
  `#f7f4eb`.
- **Shared chrome:** top bar (cart · wordmark · menu) and footer (newsletter + open/closed ticker)
  are **injected by `assets/site.js`** on every page — don't hand‑code them; keep loading `site.js`.
- **Icons/favicons:** `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`.
- **Custom elements:** `<image-slot …>` renders a placeholder image area.
  `<div class="phone-combo"><select class="pc-cc">…</select><input …></div>` is the country‑code +
  number field.

### Mobile specifics currently in place
- Mobile nav ends with a paired **Account / Book Now** action row (`.m-actions`).
- Service menus fold into an accordion by group on phones.
- Footer is **hidden on mobile** on: `book`, `gift-card`, `checkout`, `gift`, `cart`, `account`.
- Shop's top bar is opaque with a cream cap so product photos never peek through on iOS scroll.

---

## 5. The integration seams (KEEP THESE)

The shared scripts below must stay loaded (in this order, after the Supabase CDN):

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="assets/supabase.js"></script>   <!-- creates window.SB (Supabase client) -->
<script src="assets/phone.js"></script>       <!-- window.IncensoPhone — fills .pc-cc selects -->
<script src="assets/auth.js"></script>        <!-- window.IncensoAuth — accounts, sign-in, refs, Stripe -->
<script src="assets/gift.js"></script>        <!-- window.IncensoGift — gift cards -->
<script src="assets/products.js"></script>    <!-- window.IncensoProducts — shop products (shop only) -->
<script src="assets/catalog.js"></script>     <!-- window.IncensoCatalog — services/staff (book & menus) -->
<script src="assets/image-slot.js"></script>  <!-- <image-slot> element + window.IncensoQR -->
<script src="assets/site.js"></script>        <!-- shared header/footer + nav + behaviours -->
```

**Global helpers the pages call (don't rename):**
- `window.SB` — the Supabase client.
- `window.IncensoAuth` — accounts + sign‑in + payments. Key methods:
  `get() set() open() close() signedIn() signOut() flush() resync()`,
  `nextRef('BK'|'OR'|'GF')`, `payLabel(booking)` (the one‑line payment summary),
  `exArr(booking)` (normalises a booking's top‑ups to an array), `orderTotal(o)`, `yearSpend(acc)`,
  `tierFor()/nextTier()`, `sendDetailOtp()/verifyDetailOtp()`, `removeRestock()`,
  and **`stripeCheckout(kind, ref)`** → redirects to Stripe's hosted page (`kind` =
  `'booking'|'order'|'gift'`).
- `window.IncensoGift` — gift‑card lookups/creation/redeem/refund.
- `window.IncensoProducts` / `window.IncensoCatalog` — data for shop / booking.
- `window.IncensoPhone.fill(root)` — populates country‑code selects.
- `window.IncensoQR(url)` — returns a QR SVG.

**Element hooks that must survive a redesign** (restyle freely, keep the hook):
- Account button anywhere: `data-account-btn`.
- Phone fields: the `.phone-combo` wrapper with a `.pc-cc` `<select>` next to the number input.
- Sign‑up modal fields (rendered by `auth.js`): ids `auName`, `auEmail`, `auBirthday`, `auPhoto`.
- Account settings fields: ids `dName`, `dPhoneCC`, `dPhone`, `dEmail`, `dBirthday`, and the OTP box
  `detOtp` / `detCode` / `detConfirm`.
- Booking picker builds `/book?svc=<service>` and `/book?cat=<category>` links — keep that format.
- Cart badge: `.cart-badge`; "Add to cart" actions and product cards keep their data attributes so
  `products.js` can bind.
- **Payment / return hooks (payments are live now):** the pay step submits and then calls
  `IncensoAuth.stripeCheckout(...)`, which redirects to Stripe; Stripe returns to the same page with
  `?paid=1`, and the view pages poll until the server confirms. Keep a pay button that can trigger
  this, and — on booking/gift view pages — the "finish your card payment / pay your top‑up" call to
  action (classes `bk-pay-again`, `bk-topup-again` on the booking view) so an unfinished card
  payment can be resumed. Restyle freely; keep the ability to trigger the checkout.

If a redesign needs a **new** field or button that should talk to the backend, add it with a clear
`id`/`data-…` and describe it in the changelog — Claude Code wires it.

---

## 6. Data model (what exists in the database)

Website‑owned tables:
- `profiles` — one per member: `name, phone (+CC local), email, birthday, photo_url, prefs, tier,
  spend_12mo`. Tied to the phone sign‑in user.
- `bookings` — a member's appointments (ref `BK0001…`): services, stylist, date/time, price,
  `paid` (confirmed money), `due` (cash at studio), `gift`, **`extra` (a JSON *array* of top‑ups —
  see §7a)**, pay status, status, deadlines, `final` (the closed bill once settled).
- `orders` — shop orders (ref `OR0001…`): items, total, method, pay status, courier, deadlines.
- `gift_cards` — gift cards (ref `GF0001…`): amount, to/from, status (Reserved→Active→Used, or
  Cancelled), expiry, buyer/recipient, `redemptions`.
- `restock_requests` — "tell me when it's back" per product.
- `newsletter` — phone sign‑ups.
- `web_products, web_services, web_staff, web_categories, web_config` — the catalogue/config the
  site displays (admin‑controlled).
- `ref_counters` — issues the sequential BK/OR/GF numbers.
- `payments` — Stripe checkout sessions.
- `wa_log` — record of WhatsApp messages sent (idempotency).
- `app_secrets` — server‑side keys/config (Bird key, Stripe keys, the WhatsApp sender number). Never
  exposed to the browser.

Management‑owned (the site does **not** touch these): `clients`, `appointments`, `desk_users`,
`staff`, `services`, ledger tables. **Never reset or write these from the website.**

**References:** `BK#### / OR#### / GF####` (4 digits, no dash), issued by the `next_ref` function.

---

## 7. Backend behaviours & the prototype→real map

When Claude design ships prototype (localStorage) behaviour, Claude Code swaps it for these:

| Feature | Prototype (design) | Real (Claude Code) |
|---|---|---|
| Sign‑in | fake code box | `IncensoAuth.open()` → Supabase phone OTP delivered by **WhatsApp (Bird)**; 6‑digit code |
| Account save | localStorage | `IncensoAuth.set()` → upserts `profiles`; navigations `await IncensoAuth.flush()` first |
| Change details | any code accepted | real OTP: `sendDetailOtp()`/`verifyDetailOtp()` before saving |
| Booking | local object | `await IncensoAuth.nextRef('BK')`, saved to `bookings`; view page is server‑authoritative |
| Order | local object | `nextRef('OR')`, saved to `orders` |
| Gift card | local object | `nextRef('GF')`, saved to `gift_cards`; redeem/refund via RPCs |
| Products | hard‑coded | `IncensoProducts` from `web_products` |
| **Card payment** | in‑page card form | **Stripe hosted checkout** via `stripeCheckout(kind, ref)`; the in‑page card fields are prototype only and do **not** charge — the real charge happens on Stripe's page, which returns with `?paid=1` |
| Messages | none | DB triggers + a 15‑min cron send WhatsApp from the studio's own number |

### 7a. The payment model (unified — design should reflect this in copy & layout)

Four methods, same rules across bookings, orders and gifts, with one cash difference:

- **Card** — confirmed instantly (Stripe).
- **Whish Money / OMT Pay** — manual verification by the studio; must be paid within **24 hours**
  or it auto‑cancels.
- **Cash (pay at studio)** — settled in person. **Bookings: no timer.** **Orders & gifts: a 3‑day
  hold**, then released.

**Booking top‑ups (why the breakdown is a list).** When a paid booking is edited to add services,
the difference becomes a **separate top‑up** kept per method. A booking's `extra` field is an array
like `[{amount, pay, status:'pending'|'paid', placedAt, deadline}]`. So a booking can read, e.g.,
"**$40 card · $20 Whish Money pending · $25 OMT Pay pending**". `IncensoAuth.payLabel(booking)`
produces the one‑line summary; a full breakdown (booking/account pages) should render one row per
piece: confirmed money, each top‑up (with method + pending/paid), gift, cash due, refunds. Design
this as a repeatable list, not fixed fields.

### 7b. Messaging (now live from the studio's number)

- The studio's **own branded WhatsApp templates are approved** and in use for orders, bookings,
  gifts, reminders, cancellations, refunds and restock — all sending from the studio's own
  WhatsApp Business number (stored server‑side; the customer **contact / Whish‑OMT transfer number
  shown on the site stays +961 71 930 290**).
- **Two messages still go from Bird's shared number for now** (pending Meta steps): **sign‑in OTP**
  (needs the number's *display name* approved) and **pay‑at‑studio booking confirmation** (one
  template still in review). They switch to the studio number automatically once approved. Design
  doesn't need to do anything here.

---

## 8. Not built yet (deliberately last)

- **The management system** — separate admin app + migrating the saved clients.
- **Real images** — product/studio/staff photos and the Whish/OMT payment QR codes are still
  placeholders (`<image-slot>`).
- **WhatsApp sender display name** — pending Meta approval; until then sign‑in codes come from the
  shared number (everything else already comes from the studio number).

> Card payments are **no longer** in this list — they are live (Stripe).

---

## 9. Environment facts (for Claude Code)

- Repo: `incensostudio/incensostudio.github.io`, branch `main`; deploy = GitHub Pages (classic).
  Custom domain `incensostudio.com` (`CNAME`), `.nojekyll` present.
- Supabase project URL: `https://gcqkkruzgxpqpqxeymqx.supabase.co`; public key in
  `assets/supabase.js` (RLS‑protected — safe to ship).
- Edge Functions: `create-checkout` (builds the Stripe session, amount from the DB row, `verify_jwt
  = true`), `stripe-webhook` (marks rows paid, **must stay `verify_jwt = false`**), `send-sms-otp`
  (WhatsApp OTP sender).
- Payments: Stripe Checkout (hosted). Keys/mode in `app_secrets`.
- WhatsApp: Bird (MessageBird), EU region; sender number in `app_secrets.bird_from`.
- Home page is `index.html`; the design package calls it `Home.html` — map Home → index and keep
  the lattice/sound/rings intact.

---

## 10. Keeping design in sync BOTH ways

Design can change in two places — in Claude design, and directly on the live site (bug fixes,
mobile tweaks). To stop the two from drifting:

- **The live site is the source of truth for design.** Before Claude design makes a new change, it
  must first absorb the "live‑side design changes" below so it doesn't undo them.
- **Every design change made on the live side is logged here in plain English.** Paste it into
  Claude design and ask it to apply these first; then make the new change.
- Alternative when in doubt: take the **current live page file from the repo** into Claude design as
  the starting point (it already contains every live change) and restyle from there.

### 10a. Preview-only shim `assets/preview-nav.js` (KEEP on sync-back)
The Claude design project runs the live pages as plain files, so every page loads
`<script src="assets/preview-nav.js"></script>` right after `assets/supabase.js`. It defines
`window.IncensoNav` and rewrites the site's clean links (`/gift`, `/book?svc=…`) to file paths
(`gift.html`, `book.html?svc=…`) **only when the page is not served from `incensostudio.com`**.
It is inert on the live domain. When Claude Code syncs files back into the repo, **keep this file
and its script tag on every page** — do not strip them — so the next design sync stays drop-in.

### Live‑side design changes to mirror back into Claude design
*(made on the live site after the last design handoff — apply these to the Claude design project)*

1. **Clean lowercase URLs** — the URL map in §3. Internal links/nav use these.
2. **Birthday field (required)** — in the sign‑up modal and Account → details; a date field, not in
   the future.
3. **iOS button text colour** — buttons must set an explicit dark `color` (unset buttons render
   system‑blue on iPhone).
4. **Gift checkout default** — card inputs hidden by default ("Pay at the studio" is the default);
   they appear only when "Card" is chosen. (Same pattern on booking/checkout.)
5. **Shop product tint (mobile)** — hover/tap colour clears when you press elsewhere.
6. **Shop top bar (mobile)** — solid/opaque with a cream cap; no frosted blur on scroll.
7. **Footer hidden on mobile** on: `book`, `gift-card`, `checkout`, `gift`, `cart`, `account`.
8. **Gift page (mobile)** — the "Give someone the chair." heading is hidden on phones; card at top,
   sticky bottom pay bar.
9. **Theme colours confirmed** — home bar `#f7f4eb`, every other page `#e5dcc9`.
10. **Settings phone field** splits into country‑code select + local number; references shown as
    `BK#### / OR#### / GF####`.
11. **Payment breakdown is now a list (bookings & orders).** The booking/account payment summary
    renders one row per piece — confirmed money, each **top‑up** (method + `pending`/`paid`), gift,
    cash due, refunds — because a booking can hold several top‑ups of different methods. Keep this
    repeatable‑row layout; don't collapse it to a single "paid by X" line.
12. **Card pay = redirect to Stripe.** The in‑page card fields are visual only; on submit the flow
    redirects to Stripe's hosted page and returns with `?paid=1`. Booking/gift view pages show a
    "finish your card payment" / "pay your top‑up" button when a card payment was started but not
    completed (`bk-pay-again`, `bk-topup-again`).
13. **Booking/order/gift view pages are live** — they refresh from the server (poll + on focus), so
    the status/payment area re‑renders on its own. Keep a stable container for that summary.
14. **Whish/OMT deadlines in copy** — transfer instructions state an exact cut‑off (24h; for a
    booking, the earlier of 24h and the appointment). Cash pickup on orders/gifts states a 3‑day
    hold. Keep room for a deadline line / countdown.
15. **Home‑page footer** — the Terms / Shipping / Privacy links were **removed** from the home‑page
    footer (the legal pages still exist at their URLs).
16. **Sign‑in copy says "WhatsApp"** (not "text/SMS") — codes arrive on WhatsApp.

---

## 11. Management app (`management.html` → `management.incensostudio.com`)

**What it is.** A hidden back-office page in this repo — `management.html` + `assets/mgmt/*` — with
`<meta name="robots" content="noindex">`, never linked from the site. Claude Code serves it at
**management.incensostudio.com** (GitHub Pages allows one custom domain per repo: publish the same files
from a tiny second repo, or point the subdomain at a redirect to `/management`). Phone-first; widens to a
side rail on ≥900px. Same tokens as the site.

**Files.** `management.html` (shell, script order), `assets/mgmt/mgmt.css`, `wordmark.js`, `data.js`
(**prototype store — the seam**), `ui.js` (sheet/toast/rows/image picker/CSV), `app.js` (sign-in gate,
permissions, router, global search ⌘K), `v-today.js` (day calendar by chair, week view, booking detail,
walk-in, block time), `v-bookings.js` (bookings, clients), `v-commerce.js` (orders, desk sales/POS, gift
cards, products), `v-admin.js` (staff, services, finances, messages), `v-content.js` (site settings hub +
access), `v-reports.js`. Loads `assets/catalog.js` so services/staff start from the same source as /book.

**Sign-in & permissions (per person, from `desk_users`).** Sign-in is the site's WhatsApp OTP
(`IncensoAuth`); the number is then looked up in `desk_users`, which carries **`modules[]`** (which areas
open: today, bookings, clients, orders, gifts, products, money, reports, staff, services, messages,
settings) and **`flags`** (`ownOnly` own chair only · `settle` take payments/settle · `refunds` cancel/refund/
release · `prices` change prices & stock · `amounts` see money · `broadcast` message clients · `access`
manage sign-ins), plus `active`. Presets Owner / Reception / Chair are just starting points — Settings →
Who can sign in edits each person. Numbers not on the list (or inactive) are refused. Prototype: any 6-digit
code; the avatar switches person.

**Image uploads.** Product photos, staff photos, Our Work gallery, The Space photos, client photos and the
Whish/OMT QR codes use one picker (`MgmtUI.imagePicker`): prototype stores a downscaled data-URL; real =
upload to Supabase Storage and save the public URL in `photo_url` / `image_url`.

**Prototype → real map.** Everything reads/writes `window.IncensoMgmt.db` and calls
`IncensoMgmt.save()` — swap that object for Supabase queries + RPCs; `IncensoMgmt.log()` is the audit
trail (`audit` table). Actions → writes / messages:
- **Today**: day calendar (per-chair columns from `web_staff` + `blocks`), **week view** (load per chair per
  day), late flags (10 min past start, not arrived), "Needs attention" inbox (late, waiting, transfers to
  confirm, refunds to send, pickups waiting, low stock, failed messages, birthdays), new booking / walk-in
  (conflict + day-off check), whole-studio or per-chair block, Sell products (POS).
- **Booking**: Arrived / In chair; Confirm Whish/OMT (→ msg 21) and top-up received; **Add product to the
  visit** (`bookings.products[]`, stock decrements at settle); Settle visit (`final, discount, tip,
  settle_method` → msg 28; refund line if final < paid); Add service / top-up (`extra[]`, own method +
  deadline → 24); Reschedule (25); Message client (wa.me deep link); Record prepayment; No-show (27a,
  `clients.no_shows++`); Cancel / Release (27 / 22); Mark refund sent (16 / 27b); notes.
- **Bookings**: filters, per-chair strip, CSV export. **Clients**: tags, newsletter flag (writes `newsletter`),
  block from online booking (`clients.blocked` — /book and /checkout refuse), photo, favourite chair/service,
  lapsed (60 days), birthdays, export, delete.
- **Orders**: web orders as before + **desk sales** (`orders.source='desk'`, status collected, stock
  decremented, receipt sheet → WhatsApp), receipt, CSV export.
- **Gift cards**: sell at desk, confirm & send (33 → 30), resend, change recipient, redeem at desk, extend,
  cancel/refund, search, expiring-soon filter.
- **Products**: photo, description, category (`pcats`), SKU, cost (margin, stock value), stock & low
  threshold, shown-in-shop, best sellers, export → `web_products`.
- **Staff**: photo, bio, categories, **per-chair service list** (`web_staff.services[]` — /book offers only
  these), days, hours, commission %, colour, time off (warns about bookings to move), **payouts** (owed = settled
  services × commission + tips − paid; Pay out writes `payouts` and a cash expense) → `web_staff`, `desk_users`.
- **Services & prices**: add/edit/hide/duplicate, unit, brands, **category editor** (name, h1, intro, chairs
  line → `web_categories`), shows which chairs offer each service.
- **Finances**: today / week / month / last month / custom range; takings by method, cash drawer, commissions,
  net (incl. product cost); transfers to confirm (one tap), refunds to send, 14-day bars, chair payouts
  (owed vs paid), expenses (add/edit/delete), P&L, **Close the day** (`closes`: expected vs counted cash,
  difference, float, note), CSV export.
- **Reports**: revenue vs previous period, avg ticket, no-show rate, new vs returning, top services, by
  category, chairs (visits, revenue, occupancy, no-shows), busiest hours/days, top products & margin, top
  clients, booking sources, export.
- **Messages**: `wa_log` with status, retry failed; **Message a client** (templates or free text → wa.me
  deep link, logged as manual); **Newsletter broadcast** (audience all / Gold / lapsed, now or scheduled —
  sends via Bird template with STOP footer); subscriber list with unsubscribe + export.
- **Site settings** (`web_config`): hours + weekly closed day + closed dates; home (hero line, ticker,
  live reviews, announcement); **payments** (method on/off, **Whish/OMT QR upload**, deadlines, number);
  **shop** (delivery on/off, fee, free-over, zones text, pickup, product categories); **Our Work gallery**
  (`web_gallery`: image, caption, category, order); **The Space** (`web_space` photos + team from staff);
  member levels (add/edit); legal page texts (`web_pages`: terms/shipping/privacy); **access** (add person,
  preset, modules, flags, deactivate/remove — guards: keep one owner, can't lock yourself out); studio
  details, activity log, JSON backup.

**New data introduced by this page** (add columns/tables): `desk_users(phone, name, role, staff, modules[],
flags jsonb, active)`; `web_staff.phone, days, start_hour, end_hour, commission, time_off, bio, photo_url,
services[]`; `blocks`; `expenses`; `payouts`; `closes`; `audit`; `web_gallery`; `web_space`; `web_pages`;
`bookings.final, discount, settled_at, settle_method, tip, refund, refund_sent, arrived_at, source, notes,
products jsonb`; `orders.refund, refund_sent, partial, discount, source, sold_by`; `clients.tags[], newsletter,
blocked, photo_url, no_shows`; `web_products.image_url, descr, category, cost, sku`; `web_config.announcement,
transfer_hours, hold_days, closed_dates, closed_days, tiers, payments, qr_whish, qr_omt, shop, home,
hero_line`; `gift_cards.sold_by`.

### 11a. v3 additions (design overhaul + new modules)
- **Look**: ivory surfaces on the cream ground, chair-colour calendar blocks (`--acc` / `--acc-bg` from `web_staff.accent`), avatars everywhere (staff tinted by accent, clients pastel initials or `photo_url`), status icons on blocks, KPI cards with icon + delta.
- **Dashboard** (`#/home`, default landing): greeting, takings vs yesterday, still expected, in studio, products sold; quick actions; **Chairs right now** (current / next per chair from the rota); today's schedule; attention inbox; 7-day bars; stock & open POs; birthdays.
- **Drag & drop calendar**: pointer-drag a block to a new time (15-min snap) or another chair; confirm sheet shows overlaps / off-shift warnings; writes `bookings.start, staff` → message 25.
- **Suppliers & purchase orders** (`#/supply`, `#/po/:id`, `#/supplier/:id`): tables `suppliers(name, contact, phone, email, brands, terms, lead_days, notes)` and `purchase_orders(id PO####, supplier_id, status draft|ordered|partial|received, created_at, expected, received_at, items jsonb[{product_id, name, qty, cost, received}], notes, by, unpaid)`. Draft from low stock (groups by supplier brand match), mark ordered (WhatsApp deep link to supplier), **receive delivery** (stock += received; value booked as a Products expense unless "on account"), cancel, reorder. `ref_counters` gains `PO`.
- **Rota** (`#/rota`): weekly grid per chair; tap a cell → regular / custom shift / day off with label; copy last week; clear. Table `shifts(staff, date, off bool, start_hour, end_hour, label)`. `shiftFor(staff, date)` (regular days/hours + time off + override) is the single source for the calendar, dashboard and — on the site — /book availability (`day_busy` should read it).
- **Permissions**: modules now include `home` and `supply`.


## §11b — Staff colours & photos (v3.1)
Chair accent is derived from discipline, not stored per person: Hair `#F2C94C`, Nails `#F0917C` (2nd nails chair `#E8785F`), Make-up `#B78CE0`, Brows & Lashes `#7FC59A`. Update `web_staff.accent` to these values so the public site matches; `web_staff.photo_url` must be populated for every chair (mgmt shows the photo in avatars, calendar headers and chair filters; placeholder portraits live in `assets/staff/`).


## §11c — Management sign-in (v3.2)
There is **no separate login** for management. Staff sign up / sign in exactly like clients (WhatsApp OTP via IncensoAuth). Access is a whitelist: `desk_users` (phone, name, role preset, modules[], flags{}, staff, active). On the account page, if the signed-in phone matches an active `desk_users` row, a **Dashboard** link appears (mobile tab + intro line) → `management.incensostudio.com`. Management reads the same auth session; if the number is not whitelisted it shows a "not on the studio list" card. Removing a row / setting active=false revokes access on next load. Prototype reads the whitelist from the local mgmt store; replace with a Supabase RLS-protected select.


## §11d — Booking rules shared with /book (v3.3)
The desk follows the website exactly:
- **One account per phone number.** `clients.phone` is unique (digits-normalised). Desk "new guest" with a known number attaches to the existing account (`upsertClient`). Edits that would collide are refused.
- **Levels** = website TIERS: Member 0 · Insider ≥ $1000/12mo → 10% · Loyal ≥ $2000 → 20%, on services and the shelf. Stored per booking as `gross`, `discount`, `level`, `price` (net).
- **Visit** = one client, one start time, one or more chairs back to back. One `bookings` row per category segment, sharing `visit` (ref of the first segment; others suffixed A, B…). Each row has its own `staff`, `cat`, `services`, `start`, `mins`, `price`; commissions and settle happen per chair. Cancelling one row leaves the rest of the visit.
- **Chair per category**: named chair, or "First available" (first chair in that category that works then and is free).
- **Payment**: `cash` (due at studio) · `card` (Stripe link, `payStatus=pending`, `cardLink`) · `whish`/`omt` (`status=held`, `deadline = min(now+24h, start)`; auto-release if unpaid). Gift balance first (`gift`, `giftParts[{code,amount}]`); a transfer remainder on a gift-secured booking is a pending `extra` top-up, not a hold. Custom-quote services (`price=null`) → pay at studio only.
- **Preferences** (`prefs {mood, flags[], smoke}`) are saved on the client and copied onto each booking; shown in the booking sheet.
- Cancel / no-show refunds card/transfer the same way and puts gift parts back on the cards (`refundGift`).


## §11e — Studio contact is config (v3.3)
`web_config.studio = { address, city, maps, wa, email, instagram, tiktok }` is edited under Settings → Studio. The site binds it at load (`assets/catalog.js → applyStudio()`): `[data-studio="address|addressLines|phone|email"]` text, `[data-studio-href="maps|tel|wa|mail|instagram|tiktok"]` links, `[data-studio-tip]` tooltips. Tagged in index.html (footer), space.html (Find us), booking.html (location line). WhatsApp templates (MESSAGES.md) use `{address}` / `{studioPhone}` from the same config. The dashboard removed the read-only "Currency" line (USD is fixed).


## §11f — Music (v3.3)
Settings → Music manages `web_config.music = [{ id, title, url, file, size, dur }]` and `web_config.musicOn`. Files upload to Supabase Storage (bucket `music`, public read) and the stored `url` is the public URL; "Add by link" stores an external URL. The home-page radio button plays the list in order, looping (`index.html` radio block); empty list → built-in generative pad; `musicOn=false` hides the button. Prototype keeps uploads as data URLs (≤2.5 MB) in local storage.


## §11g — Per-day hours (v3.3)
`web_config.hours.days[0..6] = { open, close, closed }` (decimal hours, Sunday = 0). Legacy `open / closeWeek / closeWeekend / closedDays` are kept in sync for the current site code; `/book` and the calendar should read `days` first (`hoursOn(dow)`).


## §11f — Category page image (v3.4)
`web_categories.hero_url` — uploaded from Settings → Services → category edit ("Page image"). Used as the hero on hair/nails/makeup/brows-lashes pages and the home tiles. Prototype stores a data URL in `catMeta[name].hero`; real build uploads to Storage and stores the public URL.


## §11g — Transfer numbers (v3.4)
`web_config.payTo = { whish, omt }` — the account/phone number shown next to each QR on checkout and /book when a guest picks Whish or OMT. Empty → falls back to the studio WhatsApp number (`studio.wa`). Edited under Settings → Payments → Transfer details.

`web_config.transferHoursBy = { whish, omt }` — per-method hold window (falls back to `transferHours`). Deadline = min(now + hours, appointment start).


## §11h — The Space copy (v3.5)
`web_config.spaceCopy` — every text line on /space: `{ title, lead, stats:[{n,l}×3], ch1:{k,h,p1,p2}, ch2:{k,h,p1,p2}, hoursH, teamH, teamTag, findK }`. Edited in Settings → The Space. The page tags each element with `data-space="key"`; `IncensoCatalog.SPACE` holds the object and the catalog writes it into the DOM on load and after the config fetch. Missing key = keep the HTML default. `ch1.image` / `ch2.image` are the chapter photos (`[data-space-img]`); `web_config.space` (the photo list) fills the `[data-space-wall]` grid in order.

## §11i — Our Work (v3.5)
`web_config.workCopy = { h1a, h1b, lead, filterK }` and `web_config.gallery = [{ id, image, svc, staff, note, cat }]` (cat derived from svc). /work renders the wall from the gallery when any item carries `svc`; otherwise the built-in sample wall. `IncensoCatalog.WORK = { copy, items }`; the page re-draws on the `incenso:work` event.

## §11j — Legal pages (v3.5)
`web_config.legal = { terms|shipping|privacy: { updated: 'D Month YYYY', sections: [{ h, p: [paragraphs] }] } }`. Edited per section in Settings → Legal; publishing a section stamps `updated` with today's date (also settable by hand). /terms, /shipping, /privacy tag their body with `<div class="doc" data-legal="key">`; the catalog re-renders it from the config (numbering is automatic). Missing key = HTML default.

## §11k — Special days (v3.5)
`web_config.closedDates = [{ date: 'YYYY-MM-DD', label, closed: true | false, open?, close? }]` — a closure (`closed` missing or true) or one-off hours (`closed:false` + decimal `open`/`close`). Overrides the weekly hours for that date everywhere: /book slots, the open/closed ticker (`label · Open · closes …`), and /space (week list + upcoming special days with a yellow pill). `IncensoCatalog.hoursFor(date)` → `{ open, close, closed, label }`.

## §11l — Category page photo (v3.5)
`web_categories.hero_url` — the portrait photo at the top of each category page (`IncensoCatalog.CATS[].hero`). Edited from Settings → Services (the photo card above the menu, or the Category sheet). Empty = the page keeps its placeholder slot.

## §11m — Product photos (v3.5)
`web_products.images` — JSON array of up to 3 URLs (first = main); `image_url` stays as a single-photo fallback. The dashboard product sheet has three pickers; the shop carousel shows real photos when present, placeholders otherwise.

## §11n — Product fields = shop fields (v3.5)
A product is exactly what /shop shows: `cat` (hair | nails | body | home), `name`, `price`, `note` (one-liner under the name), `details` (long text in the quick view), `images[3]`, `stock` (null = unlimited, 0 = sold out). Brand / SKU / cost / low-stock are no longer edited in the dashboard sheet (kept on the row for existing data).

## §11o — Shop page copy (v3.5)
`web_config.shopCopy = { title, lead }` → `[data-shop]` on /shop. Edited in Settings → Shop → Top of the page.

## §11p — One profile per number (v3.6)
The client record **is** the website account. `clients` (dashboard) and `profiles` (site) are the same row keyed by digits-normalised phone: name, email, birthday, photo. Editing any of them anywhere (`setProfile` in data.js, client sheet, access sheet, website account) writes the one row; the access list (`desk_users`) only carries phone + preset + chair. A guest the desk adds gets a profile at once (name + phone required; email/birthday optional). When that number later signs in on the website (OTP) and has no `profiles.name`, the site must look up the profile + bookings by phone and land the person on their existing account — prototype: `deskAccount()` in `assets/auth.js` reads the dashboard store; real: `select * from profiles where phone = $1` and `bookings where client_phone = $1`, then link `auth.uid`.

## §11q — Chair order follows availability (v3.6)
A multi-category visit runs back to back, but **the order of chairs is not the order the services were picked**. For each candidate start, every ordering of the categories is tried and the first where every chair is free (and on shift) is used — so Hair 14:00 + Nails 15:00 and Nails 14:00 + Hair 15:00 are both valid plans for a 14:00 slot. `/book` saves the chosen order on the booking (`order: [cat…]`, `services` already sorted); the desk writes one row per chair with its own `start`. The `day_busy` RPC and slot search must accept either order. Editing a visit re-plans with the same rule.

## §11r — Order lifecycle = website lifecycle (v3.6)
Statuses are the website's steps. **Pickup:** placed (only while a transfer is pending → "Awaiting payment") → ready ("Ready for pickup" — immediately when paid or paying cash at the studio) → collected. **Delivery:** placed → preparing → with-courier (courier { company, eta, tracking } shown on the client's tracking page) → delivered. Manual orders from the desk (`source: 'whatsapp'`) follow the same rules as checkout: fee from `web_config.shop.deliveryFee`, cash pickup held 3 days (`deadline`), Whish/OMT 24h, card = Stripe link (`cardLink`, pending until webhook), gift balance applied first (`gift: { amount, parts }`). **Auto-cancel** (`sweep()` in data.js; real: a scheduled job): transfer past deadline → cancelled + items back in stock, reason "We didn't receive your … transfer by the deadline…"; cash pickup not collected in 3 days → cancelled, items back; held bookings released; reserved gift cards cancelled. Manual cancel asks for a reason → `cancelReason` (shown under "Why" on the website), refunds the non-gift part, restores gift balance. Receipts send automatically on collected/delivered/desk sale.

## §11s — Stock, suppliers & finances (v3.7) — final desk model
**Stock** (`#/products`) has three sections: Shelf (`web_products`, retail — `cost` per unit added, `low` alert), Backbar (`supplies`: { id, name, brand, cat, unit, qty, low, cost, supplierId, lastIn, log[] } — professional consumables; `adjustSupply(id, delta, note, by)` logs use/receipt), Suppliers · orders (`purchases`). Purchase-order lines link to either `productId` or `supplyId`; receiving tops up the right stock. **Terms are set at "Mark as ordered"**: `terms` = now | credit | part, `partAmt`, `dueDays`, `expected`; receiving records the paid part as a Products expense and leaves `unpaid` + `dueBy` on the PO; "Close — rest won't come" drops undelivered lines (`shortBy`) and keeps the credit owed; "Pay supplier" settles it. Tiles: Suppliers · On order (value still to arrive) · Owed (received, unpaid) · Paid (all time).
**Finances** (`#/money`) is a month ledger. `settings.openingBalance = { date, amount }` is the only manual anchor; every day's balance = opening + Σ money in − Σ money out. Money in = settled visits (`settledAt`), completed orders, active gift cards, plus manual `income[] = { id, label, amount, method, date }`. Money out = paid `expenses` (one-off, or fixed bills stamped `fixedId` + `month` key) and staff `payouts`. `settings.fixedCosts[] = { id, label, category, amount, freq: monthly|weekly, dueDay | weekday }` generate bills per month (weekly → one per matching weekday; paid record key = that date). Planned one-offs are `expenses` with `planned: true, due` until marked paid. No "close the day" — everything is continuous. Real: a `ledger` view or nightly materialisation per day is enough; all of the above are plain tables.
**Sample data:** the app ships in blank mode (`localStorage incenso-mgmt-blank = 1`): catalog kept, transactions empty. Demo data is only for the design preview.
