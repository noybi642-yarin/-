create extension if not exists pgcrypto;

alter table public.authorities add column if not exists updated_by text;
alter table public.centers add column if not exists updated_by text;
alter table public.contacts add column if not exists updated_by text;
alter table public.tasks add column if not exists updated_by text;
alter table public.risks add column if not exists updated_by text;
alter table public.opportunities add column if not exists updated_by text;
alter table public.documents add column if not exists updated_by text;
alter table public.notes add column if not exists updated_by text;

create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  entity_type text not null,
  entity_id text,
  summary text,
  updated_by text,
  created_at timestamptz not null default now()
);

alter table public.activity_log enable row level security;

drop policy if exists "Public read activity log" on public.activity_log;
drop policy if exists "Public write activity log" on public.activity_log;

create policy "Public read activity log" on public.activity_log for select using (true);
create policy "Public write activity log" on public.activity_log for all using (true) with check (true);
