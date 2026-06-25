create extension if not exists pgcrypto;

create table if not exists public.authorities (
  id text primary key,
  name text not null,
  status text not null default 'green' check (status in ('green', 'yellow', 'red')),
  students_count text,
  mentors_count text,
  center_manager text,
  last_update text,
  open_tasks_count text default '0',
  open_risks_count text default '0',
  payload jsonb not null default '{}'::jsonb,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.centers (
  id uuid primary key default gen_random_uuid(),
  authority_id text references public.authorities(id) on delete set null,
  title text,
  status text,
  payload jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  authority_id text references public.authorities(id) on delete set null,
  title text,
  status text,
  payload jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  authority_id text references public.authorities(id) on delete set null,
  title text,
  status text,
  payload jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.risks (
  id uuid primary key default gen_random_uuid(),
  authority_id text references public.authorities(id) on delete set null,
  title text,
  status text,
  payload jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  authority_id text references public.authorities(id) on delete set null,
  title text,
  status text,
  payload jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  authority_id text references public.authorities(id) on delete set null,
  title text,
  status text,
  payload jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  storage_key text unique,
  authority_id text references public.authorities(id) on delete set null,
  note_type text not null default 'page_note',
  title text,
  content text,
  payload jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  entity_type text not null,
  entity_id text,
  summary text,
  updated_by text,
  created_at timestamptz not null default now()
);

alter table public.authorities add column if not exists updated_by text;
alter table public.centers add column if not exists updated_by text;
alter table public.contacts add column if not exists updated_by text;
alter table public.tasks add column if not exists updated_by text;
alter table public.risks add column if not exists updated_by text;
alter table public.opportunities add column if not exists updated_by text;
alter table public.documents add column if not exists updated_by text;
alter table public.notes add column if not exists updated_by text;

alter table public.authorities enable row level security;
alter table public.centers enable row level security;
alter table public.contacts enable row level security;
alter table public.tasks enable row level security;
alter table public.risks enable row level security;
alter table public.opportunities enable row level security;
alter table public.documents enable row level security;
alter table public.notes enable row level security;
alter table public.activity_log enable row level security;

create policy "Public read authorities" on public.authorities for select using (true);
create policy "Public write authorities" on public.authorities for all using (true) with check (true);
create policy "Public read centers" on public.centers for select using (true);
create policy "Public write centers" on public.centers for all using (true) with check (true);
create policy "Public read contacts" on public.contacts for select using (true);
create policy "Public write contacts" on public.contacts for all using (true) with check (true);
create policy "Public read tasks" on public.tasks for select using (true);
create policy "Public write tasks" on public.tasks for all using (true) with check (true);
create policy "Public read risks" on public.risks for select using (true);
create policy "Public write risks" on public.risks for all using (true) with check (true);
create policy "Public read opportunities" on public.opportunities for select using (true);
create policy "Public write opportunities" on public.opportunities for all using (true) with check (true);
create policy "Public read documents" on public.documents for select using (true);
create policy "Public write documents" on public.documents for all using (true) with check (true);
create policy "Public read notes" on public.notes for select using (true);
create policy "Public write notes" on public.notes for all using (true) with check (true);
create policy "Public read activity log" on public.activity_log for select using (true);
create policy "Public write activity log" on public.activity_log for all using (true) with check (true);

insert into public.authorities (id, name, status)
values
  ('netanya', 'נתניה', 'green'),
  ('hadera', 'חדרה', 'yellow'),
  ('basmat', 'בסמת טבעון', 'red'),
  ('zarzir', 'זרזיר', 'yellow'),
  ('haifa', 'חיפה', 'green')
on conflict (id) do nothing;
