-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query).
-- This app has no auth yet (see lib/anon-id.ts) — owner_id is a random UUID
-- generated per browser and stored in localStorage, not a verified identity.

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

-- IMPORTANT: these policies do NOT provide real per-user isolation.
-- Without Supabase Auth, there is no server-verifiable way to know who is
-- making a request — the anon key is public (it ships in client JS), and
-- any policy based on a client-supplied owner_id can be bypassed by anyone
-- who calls the REST API directly with a different owner_id. This only
-- keeps *this app's own UI* scoped to one browser's data; it does not stop
-- other holders of the anon key from reading/writing any row.
-- Replace with auth.uid()-based policies once real login is added.
create policy "allow all select" on public.checklists
  for select using (true);

create policy "allow all insert" on public.checklists
  for insert with check (true);

create policy "allow all update" on public.checklists
  for update using (true);

create policy "allow all delete" on public.checklists
  for delete using (true);
