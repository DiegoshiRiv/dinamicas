-- Índices y restricciones recomendados para 500+ registros simultáneos.
-- Ejecutar en el SQL Editor de Supabase antes del evento.
--
-- CRÍTICO: UNIQUE(ip_address) es la defensa contra doble registro cuando
-- el cliente hace timeout y reintenta (el INSERT tardío + reintento).
-- Sin este índice, un timeout puede crear dos filas.

-- Un registro por IP (incluye código de ruleta en ip_address).
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
