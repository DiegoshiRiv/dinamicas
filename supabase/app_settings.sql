-- Configuración global de la app (ejecutar en Supabase SQL Editor)

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

drop policy if exists "app_settings_select" on public.app_settings;
create policy "app_settings_select" on public.app_settings
  for select using (true);

drop policy if exists "app_settings_upsert" on public.app_settings;
create policy "app_settings_upsert" on public.app_settings
  for insert with check (true);

drop policy if exists "app_settings_update" on public.app_settings;
create policy "app_settings_update" on public.app_settings
  for update using (true);
