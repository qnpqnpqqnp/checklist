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

-- 실제 그룹 기능(아래 참고) 도입 이전에 쓰던 가짜 공유 코드 필드.
-- 진짜 멤버십이 없어 초대 코드를 아는 사람이면 정책상 전부 허용됐던
-- 임시 구현이라, groups/group_members + group_id로 완전히 대체합니다.
alter table public.checklists drop column if exists group_code;

alter table public.checklists enable row level security;

-- 그룹 (실시간 공유 체크리스트)
-- 그룹은 로그인 필수: 그룹 기능은 auth.uid()가 있는 사용자만 쓸 수 있게
-- 정책을 짜고, 앱 UI에서도 비로그인 사용자에게는 그룹 관련 화면을 숨깁니다.
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.groups enable row level security;

-- 초대 코드로 그룹을 찾으려면 먼저 읽을 수 있어야 하므로, 로그인한
-- 사용자에게는 조회를 열어둡니다 (코드 자체가 초대장 역할이라 이는
-- 기존 "코드를 아는 사람이면 접근 가능" 모델과 같은 수준의 노출입니다).
create policy "authed can read groups" on public.groups
  for select using (auth.uid() is not null);

create policy "authed can create own group" on public.groups
  for insert with check (auth.uid() = owner_id);

-- 그룹 멤버십 (다대다)
create table if not exists public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

alter table public.group_members enable row level security;

-- NOTE: this used to also allow seeing OTHER members' rows in a shared
-- group via "exists (select 1 from group_members gm2 where ...)" — but a
-- policy that queries its own table recursively triggers RLS on that same
-- subquery scan, which re-triggers the policy, and so on: Postgres detects
-- this as infinite recursion (42P17) and every query touching the policy
-- fails, including unrelated checklists queries that reference
-- group_members via EXISTS. Nothing in the app actually needs to see other
-- members' rows (only "am I in this group"), so this stays a plain,
-- non-recursive check.
drop policy if exists "member can read own group memberships" on public.group_members;

create policy "member can read own membership" on public.group_members
  for select using (user_id = auth.uid());

create policy "authed can join a group" on public.group_members
  for insert with check (user_id = auth.uid());

-- checklists: 그룹에 속한 체크리스트를 위한 컬럼
alter table public.checklists add column if not exists group_id uuid references public.groups(id) on delete cascade;
create index if not exists checklists_group_id_idx on public.checklists (group_id);

-- IMPORTANT: anonymous (logged-out) access still has no real isolation for
-- *personal* (group_id is null) rows — the anon key is public (it ships in
-- client JS), and a policy based on a client-supplied owner_id can be
-- bypassed by anyone who calls the REST API directly with a different
-- owner_id. That's an accepted tradeoff so the app keeps working without an
-- account.
--
-- Group rows are different: they always require auth.uid() to be present
-- AND a matching group_members row, so anonymous callers can never read or
-- write group checklists regardless of the personal-row fallback above.
-- Any group member (not just the row's own owner_id/creator) can
-- update/delete a group checklist, matching the "그룹 멤버 전원이 체크/추가/
-- 삭제 가능" requirement.
drop policy if exists "allow all select" on public.checklists;
drop policy if exists "allow all insert" on public.checklists;
drop policy if exists "allow all update" on public.checklists;
drop policy if exists "allow all delete" on public.checklists;
drop policy if exists "anon or own select" on public.checklists;
drop policy if exists "anon or own insert" on public.checklists;
drop policy if exists "anon or own update" on public.checklists;
drop policy if exists "anon or own delete" on public.checklists;

create policy "checklists select" on public.checklists
  for select using (
    (group_id is null and (auth.uid() is null or auth.uid() = owner_id))
    or (group_id is not null and auth.uid() is not null and exists (
      select 1 from public.group_members gm
      where gm.group_id = checklists.group_id and gm.user_id = auth.uid()
    ))
  );

create policy "checklists insert" on public.checklists
  for insert with check (
    (group_id is null and (auth.uid() is null or auth.uid() = owner_id))
    or (group_id is not null and auth.uid() is not null and auth.uid() = owner_id and exists (
      select 1 from public.group_members gm
      where gm.group_id = checklists.group_id and gm.user_id = auth.uid()
    ))
  );

create policy "checklists update" on public.checklists
  for update using (
    (group_id is null and (auth.uid() is null or auth.uid() = owner_id))
    or (group_id is not null and auth.uid() is not null and exists (
      select 1 from public.group_members gm
      where gm.group_id = checklists.group_id and gm.user_id = auth.uid()
    ))
  )
  with check (
    (group_id is null and (auth.uid() is null or auth.uid() = owner_id))
    or (group_id is not null and auth.uid() is not null and exists (
      select 1 from public.group_members gm
      where gm.group_id = checklists.group_id and gm.user_id = auth.uid()
    ))
  );

create policy "checklists delete" on public.checklists
  for delete using (
    (group_id is null and (auth.uid() is null or auth.uid() = owner_id))
    or (group_id is not null and auth.uid() is not null and exists (
      select 1 from public.group_members gm
      where gm.group_id = checklists.group_id and gm.user_id = auth.uid()
    ))
  );

-- 그룹 체크리스트의 실시간 동기화(Realtime)를 위해 이 테이블의 변경사항을
-- 브로드캐스트합니다. Realtime도 위 RLS를 그대로 적용하므로, 그룹 멤버가
-- 아닌 클라이언트에는 이벤트가 전달되지 않습니다.
-- (이미 추가되어 있으면 다시 실행해도 에러 없이 건너뜁니다.)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'checklists'
  ) then
    alter publication supabase_realtime add table public.checklists;
  end if;
end $$;

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
