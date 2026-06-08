-- Tabla de eventos de la comunidad (ejecutar en Supabase SQL Editor)

create table if not exists public.community_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  pokemon_image_url text not null default '',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  has_stamp boolean not null default false,
  location_name text not null default 'Parque Morelos',
  location_maps_url text not null default 'https://www.google.com/maps/search/?api=1&query=20.680624,-103.340587',
  location_lat double precision,
  location_lng double precision,
  wild_iv_cp integer,
  research_iv_cp integer,
  special_research_tasks text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists community_events_starts_at_idx on public.community_events (starts_at);

alter table public.community_events enable row level security;

drop policy if exists "community_events_select" on public.community_events;
create policy "community_events_select" on public.community_events
  for select using (true);

drop policy if exists "community_events_insert" on public.community_events;
create policy "community_events_insert" on public.community_events
  for insert with check (true);

drop policy if exists "community_events_update" on public.community_events;
create policy "community_events_update" on public.community_events
  for update using (true);

drop policy if exists "community_events_delete" on public.community_events;
create policy "community_events_delete" on public.community_events
  for delete using (true);
