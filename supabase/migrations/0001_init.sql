-- Incenso OS — persisted state.
--
-- The app keeps the whole mutable slice (appointments, notifications, queued
-- messages, desk-created clients, the stock-consumption ledger, the retail-sold
-- ledger, ordered items and order-lifecycle positions) as a single JSON
-- document per workspace. This mirrors the prototype's localStorage blob and
-- keeps the client's optimistic write model intact — the checkout write-path
-- stays a single atomic update.
--
-- A production build would normalise these into real tables (appointments,
-- clients, ledgers, …) behind row-level security per salon. This document
-- store is the minimal backing that lets the UI sync across devices today.

create table if not exists public.os_state (
  id          text primary key,             -- workspace / tenant id
  state       jsonb not null default '{}',  -- the PersistedState document
  updated_at  timestamptz not null default now()
);

alter table public.os_state enable row level security;

-- Demo policy: the single shared workspace is readable/writable with the anon
-- key. Replace with per-tenant, auth-scoped policies before real use.
drop policy if exists "os_state anon read"  on public.os_state;
drop policy if exists "os_state anon write" on public.os_state;

create policy "os_state anon read"
  on public.os_state for select
  using (true);

create policy "os_state anon write"
  on public.os_state for all
  using (true)
  with check (true);
