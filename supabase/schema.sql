create extension if not exists pgcrypto;

create table if not exists public.release_hub_workspaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null default '{"artists":[],"releases":[],"tasks":[],"dayCompletions":{}}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.release_hub_workspaces enable row level security;

drop policy if exists "release hub users can read own workspace" on public.release_hub_workspaces;
drop policy if exists "release hub users can insert own workspace" on public.release_hub_workspaces;
drop policy if exists "release hub users can update own workspace" on public.release_hub_workspaces;
drop policy if exists "release hub users can delete own workspace" on public.release_hub_workspaces;

create policy "release hub users can read own workspace"
  on public.release_hub_workspaces
  for select
  using (auth.uid() = user_id);

create policy "release hub users can insert own workspace"
  on public.release_hub_workspaces
  for insert
  with check (auth.uid() = user_id);

create policy "release hub users can update own workspace"
  on public.release_hub_workspaces
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "release hub users can delete own workspace"
  on public.release_hub_workspaces
  for delete
  using (auth.uid() = user_id);

create or replace function public.set_release_hub_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_release_hub_workspaces_updated_at on public.release_hub_workspaces;

create trigger set_release_hub_workspaces_updated_at
  before update on public.release_hub_workspaces
  for each row
  execute function public.set_release_hub_updated_at();
