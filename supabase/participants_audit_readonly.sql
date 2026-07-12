-- Auditoría rápida de Supabase (solo lectura). Ejecutar en SQL Editor.
-- No cambia datos; sirve para revisar índices, tamaños y planes antes del evento.

-- 1) Índices en participants / banned_ips / recent_winners
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('participants', 'banned_ips', 'recent_winners', 'sponsor_banners')
ORDER BY tablename, indexname;

-- 2) Conteo y tamaño aproximado
SELECT
  relname AS table,
  n_live_tup AS approx_rows
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND relname IN ('participants', 'banned_ips', 'recent_winners')
ORDER BY relname;

-- 3) Plan de la consulta más frecuente (lista de participantes)
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, username, team, status, ip_address, registration_token
FROM public.participants
ORDER BY created_at ASC;

-- 4) Plan de lookup por IP+sala (verify post-timeout)
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, username, team, status, ip_address, registration_token
FROM public.participants
WHERE ip_address = '0.0.0.0::r:general'
LIMIT 1;

-- 5) Plan de lookup por token
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, username, team, status, ip_address, registration_token
FROM public.participants
WHERE registration_token = '00000000-0000-0000-0000-000000000000::r:general'
LIMIT 1;

-- 6) Políticas RLS (revisar que no fuerzen seq scans innecesarios)
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('participants', 'banned_ips', 'recent_winners', 'sponsor_banners')
ORDER BY tablename, policyname;

-- Esperado:
-- - Index Scan / Index Only Scan en lookups por ip_address y registration_token
-- - UNIQUE presentes (participants_ip_address_unique, participants_registration_token_unique)
-- - RLS permisiva de SELECT/INSERT para anon si el registro público lo requiere
