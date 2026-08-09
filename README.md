# Incenso Studio — Salon Management System

The front-desk system for **Incenso Studio**: sign in, run the day as a per-stylist
calendar, book appointments, check clients in, build a ticket, take payment, and close
the day into a running ledger — plus a client directory with visit history.

Works on any desktop browser and installs as a **PWA** on phones.

Live at **https://management.incensostudio.com**

## Tech

- **Frontend:** React + TypeScript + Vite, installable PWA (`vite-plugin-pwa`)
- **Backend:** Supabase (Postgres + Auth + Row Level Security)
- **Auth:** front-desk passcode sign-in, verified server-side in the `desk-auth`
  Edge Function (bcrypt hashes, 6-try lockout). No passcodes ever ship to the browser.
- **Hosting:** GitHub Pages via GitHub Actions (auto-deploys on every push)

## Local development

```bash
npm install
npm run dev        # http://localhost:5173
```

`npm run build` produces the production site in `dist/`. Supabase URL and the
public (RLS-protected) publishable key live in `src/lib/config.ts`.

## Project layout

```
src/
  App.tsx              app shell (rail / mobile tab bar, header, drawers)
  store.tsx            data + all actions, wired to Supabase
  screens/             SignIn · Book · Clients · Payments
  drawers/             Ticket · Booking · Client card · Close day
  lib/                 types, formatting, history derivation, tokens
supabase/functions/
  desk-auth/           passcode sign-in Edge Function
```

## Data model

The **visit** (a client's services on one day) is the core unit — one ticket, one
payment, one history entry. Services and products are separate: a product can never
hold a time, a stylist, or a calendar slot. Client history and every ledger figure are
**derived** from the underlying tickets, never stored as summaries.
