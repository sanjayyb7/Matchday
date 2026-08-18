-- Shared day schedule + squad caches (one API-Football pull per SF day)

CREATE TABLE IF NOT EXISTS public.match_day_cache (
  cache_date DATE PRIMARY KEY,
  fixtures_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  teams_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.team_squad_cache (
  team_id TEXT PRIMARY KEY,
  players_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.match_day_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_squad_cache ENABLE ROW LEVEL SECURITY;

-- Server/admin client reads/writes; no public policies needed for anon
DROP POLICY IF EXISTS match_day_cache_admin_all ON public.match_day_cache;
CREATE POLICY match_day_cache_admin_all ON public.match_day_cache
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS team_squad_cache_admin_all ON public.team_squad_cache;
CREATE POLICY team_squad_cache_admin_all ON public.team_squad_cache
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
