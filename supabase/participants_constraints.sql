-- Correcciones de esquema aplicadas el 2026-08-30 (ya ejecutadas en produccion).
-- Se dejan aqui para poder reconstruir el proyecto desde cero.
-- Ejecutar DESPUES de participants_performance.sql: ese script crea las
-- columnas username_key / registration_token que este indexa.

-- 1) team dejo de ser un equipo fijo y ahora guarda un color hex (#e11d48).
--    El CHECK antiguo solo aceptaba blue/yellow/red, asi que TODO registro
--    fallaba con 23514 desde que se quitaron los equipos.
alter table public.participants drop constraint if exists participants_team_check;

-- 2) unique_username era global y para siempre: quien se registraba en un
--    evento bloqueaba ese nombre en todos los eventos siguientes. La unicidad
--    correcta es por sala y la da el indice parcial sobre username_key.
alter table public.participants drop constraint if exists unique_username;

-- Indice que si debe existir: unicidad de nombre dentro de cada sala.
create unique index if not exists participants_username_key_unique
  on public.participants (username_key)
  where username_key is not null;

-- 3) La app se suscribe a cambios de app_settings, pero la tabla no estaba
--    publicada en Realtime, asi que los espectadores nunca recibian el evento.
alter publication supabase_realtime add table public.app_settings;
