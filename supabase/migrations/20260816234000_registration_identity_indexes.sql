-- Ensure the registration identity columns and indexes required by the
-- roulette flow exist in Supabase.
--
-- Current frontend behavior:
-- - username_key is the main uniqueness guard per roulette.
-- - registration_token, device_fingerprint, and ip_address are generated from
--   device + username + roulette code, so multiple people can register from
--   the same phone while duplicate trainer names remain blocked.

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
