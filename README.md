# Incenso Studio — Management app

The studio's back-office, live at **https://management.incensostudio.com**: calendar by chair,
bookings, clients, orders + desk sales (POS), gift cards, products & stock, suppliers & purchase
orders, staff & rota, finances, reports, WhatsApp messages, and every site setting — behind a
WhatsApp-OTP sign-in with per-person permissions.

## Tech

- **Frontend:** plain HTML/CSS/JS, **no build step** (same stack as incensostudio.com). Entry is
  `management.html` / `index.html`; views live in `assets/mgmt/*`.
- **Backend:** Supabase (Postgres + Auth + Edge Functions), shared with the customer site.
- **Sign-in:** the site's WhatsApp OTP (`IncensoAuth`), then a `desk_users` lookup for
  per-person modules + permission flags.
- **Hosting:** GitHub Pages via GitHub Actions — **deploys from `main` only** (feature branches
  don't publish to the live URL).

## Structure

- `management.html` / `index.html` — app shell (keep the script order).
- `assets/mgmt/` — the app: `mgmt.css`, `data.js` (the Supabase data layer), `ui.js`, `app.js`
  (sign-in gate, permissions, router, ⌘K search), and the view modules `v-today`, `v-bookings`,
  `v-commerce`, `v-admin`, `v-content`, `v-reports`, `v-home`, `v-supply`, plus `wordmark.js`.
- `assets/catalog.js`, `assets/auth.js`, `assets/supabase.js`, `assets/phone.js` — shared modules
  reused from the customer site (catalogue seed + WhatsApp-OTP sign-in).
- `assets/preview-nav.js` — design-preview shim; inert on the live domain.
- `supabase/functions/` — Edge Functions.

The design ↔ backend contract for the customer site lives in that repo's `HANDOFF-CONTRACT.md`;
this app's spec is §11 / §11a there. Design and behaviour live in the same page files — the one
seam swapped from the design prototype is the store in `assets/mgmt/data.js` (localStorage →
Supabase).
