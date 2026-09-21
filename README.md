# Incenso Studio — Management app

The studio's back-office (v3.7), to be served at **https://manage.incensostudio.com**:
Booking (calendar by chair + visits), Shop (web orders + desk sales), Stock (shelf ·
backbar · suppliers & purchase orders), Gift cards, Clients, Finances (month ledger),
and Settings — behind a WhatsApp-OTP sign-in with per-person permissions.

It manages what the **customer website already has**. The website is the source of truth:
the management app never changes site data models — where the design and the site differ,
the app is adapted to fit the site.

## Tech
- **Frontend:** plain HTML/CSS/JS, **no build step**, **not a PWA** — a plain web app.
  Entry is `management.html` / `index.html`; views live in `assets/mgmt/*`.
- **Backend:** the same Supabase project as the customer site (Postgres + Auth + Edge
  Functions + Storage).
- **Sign-in:** WhatsApp OTP (`IncensoAuth`, shared with the site) → `desk_users` allow-list
  → per-person `modules[]` + `flags`.
- **Hosting:** GitHub Pages, **deploys from `main` only**. Custom domain
  `manage.incensostudio.com` (see `CNAME`). The old `management.incensostudio.com` is retired.

## Structure
- `management.html` / `index.html` — app shell (keep the script order).
- `assets/mgmt/` — the app: `mgmt.css`, `data.js` (**the data seam**, localStorage prototype
  → Supabase), `ui.js`, `app.js` (sign-in gate, permissions, router, ⌘K search),
  `wordmark.js`, and the views `v-today`, `v-newbooking`, `v-bookings`, `v-commerce`,
  `v-admin`, `v-content`, `v-reports`, `v-home`, `v-supply`.
- `assets/auth.js`, `assets/catalog.js`, `assets/supabase.js`, `assets/phone.js`,
  `assets/gift.js` — shared modules copied from the **live** customer site so the app
  speaks the exact same backend contract.
- `assets/staff/`, `assets/hair/` — placeholder photos for the prototype seed.
- `assets/preview-nav.js` — design-preview shim; inert on the live domain.

## Spec
The authoritative design ↔ backend contract is `HANDOFF-CONTRACT.md` **§11 (a–s)**;
`CHANGELOG-mgmt.md` is the version log (current: v3.7); `MESSAGES.md` lists the WhatsApp
templates. Wiring status and the site-fit adaptations are tracked in `MGMT-BACKEND-PLAN.md`.
