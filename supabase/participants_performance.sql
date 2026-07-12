-- Índices y restricciones recomendados para 500+ registros simultáneos.
-- Ejecutar en el SQL Editor de Supabase antes del evento.
--
-- MODELO DE UNICIDAD
-- -----------------
-- 1) ip_address ya incluye la sala: "{ip}::r:{rouletteCode}"
--    → UNIQUE(ip_address) ≈ UNIQUE(evento/sala, IP). La misma IP puede
--      registrarse en otra ruleta/evento sin chocar.
-- 2) registration_token = "{uuid-dispositivo}::r:{rouletteCode}"
--    → identidad principal del celular (resiste cambio Wi‑Fi↔ datos).
--    Misma persona en hotspot: cada teléfono tiene su propio token.
--
-- Tras desplegar el front con token, puedes soltar el UNIQUE de IP si
-- quieres permitir varios registros desde el mismo hotspot:
--   DROP INDEX IF EXISTS participants_ip_address_unique;
-- (mantén el índice no-único de abajo para búsquedas / verify post-timeout).

ALTER TABLE public.participants
  ADD COLUMN IF NOT EXISTS registration_token text;

-- Un registro por dispositivo+sala (identidad principal).
CREATE UNIQUE INDEX IF NOT EXISTS participants_registration_token_unique
  ON public.participants (registration_token)
  WHERE registration_token IS NOT NULL;

-- Un registro por IP+sala (defensa de reintentos / abuso).
-- Nota: el valor ya lleva ::r:{code}, no es IP global.
CREATE UNIQUE INDEX IF NOT EXISTS participants_ip_address_unique
  ON public.participants (ip_address);

CREATE INDEX IF NOT EXISTS participants_ip_address_idx
  ON public.participants (ip_address);

CREATE INDEX IF NOT EXISTS participants_created_at_idx
  ON public.participants (created_at);

CREATE INDEX IF NOT EXISTS banned_ips_ip_address_idx
  ON public.banned_ips (ip_address);

CREATE INDEX IF NOT EXISTS recent_winners_won_at_idx
  ON public.recent_winners (won_at DESC);

-- Habilitar Realtime en estas tablas (Dashboard > Database > Replication):
-- participants, banned_ips, recent_winners, sponsor_banners
