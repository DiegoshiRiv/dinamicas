-- Identidad de registro para registros concurrentes (50–500+).
-- Sin UNIQUE de IP: en eventos todos comparten el mismo hotspot.
--
-- Unicidad:
-- 1) registration_token = dispositivo + sala
-- 2) username_key = nombre entrenador + sala

ALTER TABLE public.participants
  ADD COLUMN IF NOT EXISTS registration_token text;

ALTER TABLE public.participants
  ADD COLUMN IF NOT EXISTS username_key text;

ALTER TABLE public.participants
  ADD COLUMN IF NOT EXISTS device_fingerprint text;

CREATE UNIQUE INDEX IF NOT EXISTS participants_registration_token_unique
  ON public.participants (registration_token)
  WHERE registration_token IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS participants_username_key_unique
  ON public.participants (username_key)
  WHERE username_key IS NOT NULL;

-- CRÍTICO: quitar UNIQUE de IP (bloqueaba a todos en el mismo Wi‑Fi).
DROP INDEX IF EXISTS participants_ip_address_unique;

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
