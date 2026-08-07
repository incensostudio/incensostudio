# Incenso Studio

Two surfaces in one Vite + React + TypeScript app, sharing one brand system:

- **`/`** — the public **Incenso Studio** website: a mobile-first client site
  with the service menu, the team, the studio's ethos, hours/location and a
  booking request form.
- **`/os`** — **Incenso OS**, the back-of-house operating system, behind a
  staff sign-in. Fully responsive down to phone width.

Routing is handled by `react-router-dom`; a `public/_redirects` gives the SPA
fallback for static hosts.

---

## Incenso OS

A back-of-house operating system for a hair, nails, makeup and brow salon —
rebuilt from the design handoff.

The organising idea: **every service performed and every millilitre drawn is
captured at checkout, and that single act updates the client's file, the stock
ledger, the retail shelf, the client's own portal and the message queue.** No
one has to type into a form to make that happen.

## What's here

Eleven screens and the full set of overlays from the design:

- **Today's Floor** — the live five-stage pipeline (`booked → reception →
  service → review → paid`), one button per card moving each client to the
  next stage, role-gated.
- **Calendar** — draggable day and week views, chair filters, overlap lanes,
  the now-line, clash detection.
- **Inbox** — every channel in one thread list, AI context, pre-filled drafts.
- **Send Queue** — the approval queue for AI-drafted messages; nothing sends
  without a human yes. Your rules always beat Mind's.
- **Client Book** + **dossier drawer** — staff-written notes, not a marketing
  profile.
- **Client Portal** — what she sees when she signs in, derived entirely from
  the last ticket closed today. Second-person copy only; never lifetime spend
  or product cost.
- **Products & Stock** — millilitre-level consumption, weeks-of-cover, one-tap
  ordering, per-staff variance.
- **Retail** — shelf, web, app and social; outside-order lifecycles.
- **Team** — performance, product discipline, and the permissions matrix.
- **Incenso Mind** — the advisory surface; every recommendation carries its
  evidence and a confidence line.
- **Finance** — month-to-date P&L (owner only).

Overlays: check-in, the checkout composer (the write point), payment, receipt,
client dossier, the five-step new-reservation wizard, the booking editor, Ask
Incenso, and the notification panel.

Roles (Owner / Manager / Reception / Staff) are enforced in the navigation and
inside the checkout drawer — not just documented.

## Architecture

```
src/
  App.tsx      router: public Site at /, OsApp at /os
  site/        the public Incenso Studio website (mobile-first)
  os/          OsApp shell, staff-login gate, demo auth
  data/        seed data + model types (ported verbatim from the prototype)
  lib/         pure domain logic (scheduling, service matching, money/time,
               the separate staff- vs client-facing copy rules), Supabase
               client, persistence layer, Ask Incenso answers, useIsMobile
  store/       Zustand store — one flat state object mirroring the prototype's
               state class, with the bump/advance stage machine and the
               checkout write-path (stock + retail ledgers)
  components/  OS shell (sidebar, header, toast), notification panel, overlays,
               drawers/
  views/       the eleven OS screens
```

Both surfaces are responsive. The OS is a reception-desk tool first, so on
phones the sidebar becomes a slide-in drawer, wide boards stack or scroll, and
drawers go full-width — usable on mobile without pretending the five-column
floor board was designed for it.

State is split the way the design specifies: the **persisted** slice
(appointments, notifications, queued messages, desk-created clients, the two
ledgers, ordered items, order positions) survives reloads; everything else
(current view, role, open drawer, drafts, filters) is session-only.

## Running

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm build      # type-check + production build
```

The app is **desktop-only by intention** (a reception-desk and back-office
tool) and fluid above ~1280px.

## Persistence & Supabase

Persistence works out of the box on `localStorage` — no backend required.

To sync the persisted state to Supabase across devices, set:

```bash
# .env
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

and apply the schema in `supabase/migrations/0001_init.sql`. Without these
variables the Supabase layer is inert and the app falls back to `localStorage`.

The schema is a single JSON-document table (`os_state`) that mirrors the
client's atomic write model. A production build would normalise it into real
tables (appointments, clients, ledgers) behind per-salon row-level security.

## Deploying

The repo ships turnkey config for both hosts:

- **Vercel** — `vercel.json` (Vite framework, `dist` output, SPA rewrite).
  Import the repo; no settings needed.
- **Netlify** — `netlify.toml` + `public/_redirects` (build `pnpm build`,
  publish `dist`, SPA redirect). Connect the repo; no settings needed.

Both build to a static SPA and serve `index.html` for every route, so `/os`
works on a hard refresh.

To turn on Supabase sync in production, add these environment variables in the
host's dashboard (they're read at build time):

```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<publishable key>
```

Without them the deployed site runs on `localStorage`, exactly like local dev.

## Fonts

ALT Gumbo (display), Geist and Geist Mono are self-hosted from
`src/assets/fonts/`. ALT Gumbo is a licensed display face — check licensing
before distribution.

## Fidelity notes carried over from the handoff

- Responsive behaviour below ~1280px is undesigned.
- The Client Book is not yet scoped to a stylist's own clients for the Staff
  role, though the permissions table promises it.
- Finance and the Mind evidence lists are read-only.
- The demo is pinned to a fixed "now" of Friday 31 July, 10:41.
