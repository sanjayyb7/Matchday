-- Let squad mates see each other's identities so the chat "Live squad" rail can
-- render everyone who joined the same match + team.
--
-- The membership lookup MUST be SECURITY DEFINER: a policy on user_identities
-- that plainly sub-selects user_identities re-enters RLS and recurses until the
-- backend is OOM-killed. SECURITY DEFINER runs as the owner and bypasses RLS on
-- the inner read, breaking the cycle.
CREATE OR REPLACE FUNCTION public.is_squad_member(
  p_match_id TEXT,
  p_team_id TEXT
)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_identities ui
    WHERE ui.user_id = (SELECT auth.uid())
      AND ui.match_id = p_match_id
      AND ui.team_id = p_team_id
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp;

DROP POLICY IF EXISTS user_identities_select_squad ON public.user_identities;
CREATE POLICY user_identities_select_squad ON public.user_identities
  FOR SELECT TO authenticated
  USING (public.is_squad_member(match_id, team_id));

GRANT EXECUTE ON FUNCTION public.is_squad_member(TEXT, TEXT) TO authenticated;
