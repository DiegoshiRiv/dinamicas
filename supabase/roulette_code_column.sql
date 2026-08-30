-- Sala como columna propia, en lugar de deducirla parseando ip_address.
--
-- Contexto: ip_address dejo de guardar una IP hace tiempo. Guardaba
-- "d:{token-dispositivo}::r:{codigo-sala}" y la pertenencia a sala se obtenia
-- partiendo ese texto por "::r:". Cualquier fila escrita sin el marcador caia
-- en la sala 'general' sin avisar. roulette_code lo hace explicito.
--
-- Es seguro ejecutarlo con la app en marcha: el frontend sigue leyendo
-- ip_address como respaldo mientras existan filas antiguas.

alter table public.participants   add column if not exists roulette_code text;
alter table public.banned_ips     add column if not exists roulette_code text;
alter table public.recent_winners add column if not exists roulette_code text;

-- Backfill desde el valor que ya existe (todo lo anterior al marcador se ignora).
update public.participants
   set roulette_code = coalesce(nullif(split_part(ip_address, '::r:', 2), ''), 'general')
 where roulette_code is null;

update public.banned_ips
   set roulette_code = coalesce(nullif(split_part(ip_address, '::r:', 2), ''), 'general')
 where roulette_code is null;

update public.recent_winners
   set roulette_code = coalesce(nullif(split_part(ip_address, '::r:', 2), ''), 'general')
 where roulette_code is null;

-- Filas nuevas de clientes viejos (o de SQL manual) aterrizan en la sala general
-- en vez de quedarse en NULL y desaparecer de todos los filtros.
alter table public.participants   alter column roulette_code set default 'general';
alter table public.banned_ips     alter column roulette_code set default 'general';
alter table public.recent_winners alter column roulette_code set default 'general';

-- Todas las consultas de la app filtran por sala.
create index if not exists participants_roulette_code_idx
  on public.participants (roulette_code);
create index if not exists banned_ips_roulette_code_idx
  on public.banned_ips (roulette_code);
create index if not exists recent_winners_roulette_code_idx
  on public.recent_winners (roulette_code);
