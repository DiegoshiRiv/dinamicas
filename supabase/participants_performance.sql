-- Índices y restricciones para registros concurrentes (50–500+).
-- Ejecutar en el SQL Editor de Supabase ANTES del evento.
--
-- MODELO DE UNICIDAD (sin IP pública)
-- ----------------------------------
-- 1) registration_token = "{uuid-dispositivo}::r:{rouletteCode}"
--    → identidad principal del celular (resiste Wi‑Fi compartido).
-- 2) username_key = "{username-normalizado}::r:{rouletteCode}"
--    → un mismo nombre de entrenador no puede entrar dos veces en la misma ruleta.
-- 3) ip_address ya NO es único: en eventos todos comparten el mismo hotspot.
--    Se guarda como d:{token}::r:{code} solo para pertenencia a sala.

ALTER TABLE public.participants
  ADD COLUMN IF NOT EXISTS registration_token text;

ALTER TABLE public.participants
  ADD COLUMN IF NOT EXISTS username_key text;

ALTER TABLE public.participants
  ADD COLUMN IF NOT EXISTS device_fingerprint text;

-- Un registro por dispositivo+sala (identidad principal).
CREATE UNIQUE INDEX IF NOT EXISTS participants_registration_token_unique
  ON public.participants (registration_token)
  WHERE registration_token IS NOT NULL;

-- Un registro por username de entrenador+sala.
CREATE UNIQUE INDEX IF NOT EXISTS participants_username_key_unique
  ON public.participants (username_key)
  WHERE username_key IS NOT NULL;

-- CRÍTICO: quitar UNIQUE de IP (bloqueaba a todos en el mismo Wi‑Fi).
DROP INDEX IF EXISTS participants_ip_address_unique;

-- Índice no único: búsquedas / sala.
CREATE INDEX IF NOT EXISTS participants_ip_address_idx
  ON public.participants (ip_address);

CREATE INDEX IF NOT EXISTS participants_device_fingerprint_idx
  ON public.participants (device_fingerprint)
  WHERE device_fingerprint IS NOT NULL;

CREATE INDEX IF NOT EXISTS participants_created_at_idx
  ON public.participants (created_at);

CREATE INDEX IF NOT EXISTS banned_ips_ip_address_idx
  ON public.banned_ips (ip_address);

CREATE INDEX IF NOT EXISTS recent_winners_won_at_idx
  ON public.recent_winners (won_at DESC);

-- Habilitar Realtime (Dashboard > Database > Replication):
-- participants, banned_ips, recent_winners, sponsor_banners
