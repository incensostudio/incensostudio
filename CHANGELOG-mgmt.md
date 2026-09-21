## v3.3 — Same booking rules as the website
- Desk booking rebuilt: services across categories, a chair per category (or first available), back-to-back segments, free-time grid, level discount, gift balance, website pay rules, preferences.
- Visits: one row per chair sharing `visit`; booking sheet links the other chairs; add-service in another category adds a chair to the visit.
- One account per phone number everywhere (desk, clients).
- Levels now Member / Insider 10% / Loyal 20% (was Member/Silver/Gold).
- Sidebar: Settings moved to the footer next to Website; avatar overlay removed.

## v3.2 — Single sign-in
- Management uses the website account session; whitelisted numbers (desk_users) get a Dashboard link on account.html. Own OTP gate removed.
- Day nav: title opens month picker, joined ‹ › arrows; day strip follows the selected week.

## v3.1 — Calendar as the backbone
- Dashboard, Calendar and Bookings merged into one page (`#/home`; `#/today` and `#/bookings[/:ref]` still resolve to it).
- Removed redundant blocks: "Chairs right now", "Today's schedule" list, duplicate KPI rows, Dashboard title/date.
- Quick actions (Book, Walk-in, Sell, Gift card, Message) moved to the top bar; account avatar replaced by a notifications bell (opens Messages).
- Booking history (awaiting payment / past / cancelled + CSV export) is a sheet from the calendar bar.
- Week grid removed (day strip dots + Rota cover it); calendar is day-only with a month picker to jump.
- Needs attention, This week and Stock sit under the calendar.

# Changes since last handoff — management app (v3)

**New:** `management.html` + `assets/mgmt/` — the studio back-office, to be served at
management.incensostudio.com. Hidden (noindex, unlinked). Full spec + prototype→real map in HANDOFF-CONTRACT.md §11.

- Sign-in: site WhatsApp OTP, allow-listed numbers only (`desk_users`), **per-person permissions** (modules + action flags; Owner / Reception / Chair presets).
- **Image uploads** everywhere they're needed: products, staff, clients, Our Work gallery, The Space, Whish/OMT QR codes.
- Today: day calendar by chair + **week view**, late flags, attention inbox, walk-in, block time, conflict checks, **desk sales (POS)** and products added to a visit.
- Bookings, Clients (tags, newsletter, block, lapsed, export), Orders (+ desk sales, receipts), Gift cards, Products & stock (cost/margin, categories, best sellers).
- Staff (photo, bio, per-chair services, time off, **payouts**), Services & prices (+ category editor), Finances (custom range, **close the day**, P&L, exports), **Reports**, Messages (**compose**, **newsletter broadcast**, subscribers), Site settings hub (hours, home, payments & QR, shop & delivery, gallery, space, levels, legal pages, access, backup).
- All behaviour is prototype (localStorage store in `assets/mgmt/data.js`) — replace `IncensoMgmt.db` reads/writes with Supabase at that one seam. New fields/tables are listed at the end of §11.
- Also kept: `assets/preview-nav.js` (design-preview shim, inert on the live domain) — §10a.

**v3:** visual overhaul (ivory surfaces, chair-colour calendar blocks, avatars, KPI cards), **Dashboard** landing, **drag & drop** on the calendar, **Suppliers & purchase orders** (stock-in), **Rota** (weekly shifts per chair). See §11a for tables.

## v3.7 — 2026-09-21
- Booking: one visit = one booking (shared status, payment, settle, edit, cancel); chairs ordered by availability; edit-visit reuses the booking form; itemised settle with per-line adjustments; visit-level rows everywhere.
- Shop: orders follow the website lifecycle (awaiting → ready/preparing → with courier → collected/delivered; auto-cancel rules); manual pickup/delivery orders; one client picker shared across Booking, Sell and Gift cards; gift balance applied first; automatic receipts.
- Gift cards: buyer is a client; cash-on-hold (3 days); expired state; redesigned card page.
- Stock: Shelf · Backbar · Suppliers; cost per unit; purchase-order terms at ordering time; close-short; supplier credit.
- Finances: month ledger with opening balance, day-by-day calendar (in/out/balance/projection), fixed costs (monthly/weekly), bills with Mark paid, manual money in, Needs you, Chairs, Visits, Orders.
- Nav: Booking · Shop · Stock · Gift cards · Clients · Finances · Settings. Messages page removed. Desktop top bar removed.
