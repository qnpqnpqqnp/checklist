-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query).
-- Login is optional (see lib/anon-id.ts): logged-out users still get a
-- random UUID per browser, stored in localStorage, used as owner_id.
-- Logged-in users use their real auth.uid() as owner_id instead — the app
-- migrates any anonymously-created rows onto that id on sign-in
-- (see app/lists-context.tsx).

create extension if not exists pgcrypto;

create table if not exists public.checklists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  title text not null,
  emoji text not null default '📝',
  pt text not null default 'none' check (pt in ('none', 'weekly', 'daily')),
  periods jsonb not null default '[]'::jsonb,
  group_code text,
  created_at timestamptz not null default now()
);

create index if not exists checklists_owner_id_idx on public.checklists (owner_id);

alter table public.checklists enable row level security;

-- IMPORTANT: anonymous (logged-out) access still has no real isolation —
-- the anon key is public (it ships in client JS), and a policy based on a
-- client-supplied owner_id can be bypassed by anyone who calls the REST API
-- directly with a different owner_id. That's an accepted tradeoff so the
-- app keeps working without an account.
--
-- Logged-in access IS isolated: auth.uid() is set server-side from the
-- caller's verified JWT and cannot be spoofed, so the "auth.uid() = owner_id"
-- half of each policy is a real per-user boundary. owner_id is already
-- `uuid`, same as auth.uid(), so no text cast is needed.
drop policy if exists "allow all select" on public.checklists;
drop policy if exists "allow all insert" on public.checklists;
drop policy if exists "allow all update" on public.checklists;
drop policy if exists "allow all delete" on public.checklists;

create policy "anon or own select" on public.checklists
  for select using (auth.uid() is null or auth.uid() = owner_id);

create policy "anon or own insert" on public.checklists
  for insert with check (auth.uid() is null or auth.uid() = owner_id);

create policy "anon or own update" on public.checklists
  for update using (auth.uid() is null or auth.uid() = owner_id)
  with check (auth.uid() is null or auth.uid() = owner_id);

create policy "anon or own delete" on public.checklists
  for delete using (auth.uid() is null or auth.uid() = owner_id);

-- Shared, global usage counters for the template gallery (/templates).
-- Stored as a single JSON blob (one row) rather than a normalized table,
-- matching the read-modify-write approach used by the design prototype.
-- Same caveat as above: no auth means no real write protection.
create table if not exists public.template_stats (
  id text primary key,
  data jsonb not null default '{}'::jsonb
);

alter table public.template_stats enable row level security;

create policy "allow all select" on public.template_stats
  for select using (true);

create policy "allow all insert" on public.template_stats
  for insert with check (true);

create policy "allow all update" on public.template_stats
  for update using (true);
