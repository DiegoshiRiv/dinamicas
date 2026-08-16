-- Índices y restricciones recomendados para 500+ registros simultáneos.
-- Ejecutar en el SQL Editor de Supabase antes del evento.
--
-- MODELO DE UNICIDAD
-- -----------------
-- 1) ip_address ya incluye la sala: "{identidad-generada}::r:{rouletteCode}"
--    → UNIQUE(ip_address) se conserva por compatibilidad con la tabla.
--      El frontend actual genera este valor por dispositivo+username+sala,
--      no por IP pública, para evitar conflictos de red compartida.
-- 2) registration_token = "{uuid-dispositivo}:{username-normalizado}::r:{rouletteCode}"
--    → identidad principal del registro. Permite varios usuarios desde el
--      mismo celular si cada nombre de entrenador es distinto.
-- 3) username_key = "{username-normalizado}::r:{rouletteCode}"
--    → un mismo nombre de entrenador no puede entrar dos veces en la misma ruleta
--      aunque cambie de navegador / IP / borre datos.
-- 4) device_fingerprint = huella suave del navegador + username normalizado
--    (índice no único; sirve para recuperar el registro reciente).
--
-- El registro público ya no depende de IP pública. No soltar
-- participants_ip_address_unique sin revisar el frontend: hoy se usa como
-- segunda barrera de unicidad con una identidad generada.

ALTER TABLE public.participants
  ADD COLUMN IF NOT EXISTS registration_token text;

ALTER TABLE public.participants
  ADD COLUMN IF NOT EXISTS username_key text;

ALTER TABLE public.participants
  ADD COLUMN IF NOT EXISTS device_fingerprint text;

-- Un registro por dispositivo+username+sala (identidad principal).
CREATE UNIQUE INDEX IF NOT EXISTS participants_registration_token_unique
  ON public.participants (registration_token)
  WHERE registration_token IS NOT NULL;

-- Un registro por username de entrenador+sala (anti multi-cuenta por nombre).
CREATE UNIQUE INDEX IF NOT EXISTS participants_username_key_unique
  ON public.participants (username_key)
  WHERE username_key IS NOT NULL;

-- Un registro por identidad generada+sala (no IP pública).
-- Nota: el valor ya lleva ::r:{code}.
CREATE UNIQUE INDEX IF NOT EXISTS participants_ip_address_unique
  ON public.participants (ip_address);

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

-- Habilitar Realtime en estas tablas (Dashboard > Database > Replication):
-- participants, banned_ips, recent_winners, sponsor_banners
