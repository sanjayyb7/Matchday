-- Terac claim codes: partner claims a field-registered pub after subscribing

ALTER TABLE public.field_visits
  ADD COLUMN IF NOT EXISTS claim_code TEXT;

ALTER TABLE public.field_visits
  ADD COLUMN IF NOT EXISTS claimed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.field_visits
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;

-- Backfill codes for existing rows
UPDATE public.field_visits
SET claim_code = 'LD-' || upper(substr(replace(id::text, '-', ''), 1, 6))
WHERE claim_code IS NULL;

ALTER TABLE public.field_visits
  ALTER COLUMN claim_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_field_visits_claim_code
  ON public.field_visits (claim_code);

CREATE INDEX IF NOT EXISTS idx_field_visits_claimed_by
  ON public.field_visits (claimed_by)
  WHERE claimed_by IS NOT NULL;
