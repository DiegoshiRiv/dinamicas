-- Ejecutar en Supabase SQL Editor (una sola vez)
alter table public.banned_ips
  add column if not exists banned_by text;

create index if not exists banned_ips_banned_by_idx on public.banned_ips (banned_by);
