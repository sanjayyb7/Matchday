-- Matchday core schema + RLS

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  fan_since TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  flag_url TEXT NOT NULL,
  country_code TEXT NOT NULL,
  color TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.pubs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  address TEXT NOT NULL,
  neighborhood TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.matches (
  id TEXT PRIMARY KEY,
  home_team_id TEXT NOT NULL REFERENCES public.teams(id),
  away_team_id TEXT NOT NULL REFERENCES public.teams(id),
  kickoff TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('upcoming', 'live', 'finished')),
  venue TEXT
);

CREATE TABLE IF NOT EXISTS public.players (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES public.teams(id),
  name TEXT NOT NULL,
  number INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  age INTEGER,
  country TEXT,
  position TEXT,
  club TEXT,
  goals INTEGER NOT NULL DEFAULT 0,
  assists INTEGER NOT NULL DEFAULT 0,
  caps INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.user_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id TEXT NOT NULL REFERENCES public.matches(id),
  team_id TEXT NOT NULL REFERENCES public.teams(id),
  player_id TEXT NOT NULL REFERENCES public.players(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, match_id)
);

CREATE TABLE IF NOT EXISTS public.fan_presence (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id TEXT NOT NULL REFERENCES public.matches(id),
  player_id TEXT NOT NULL REFERENCES public.players(id),
  team_id TEXT NOT NULL REFERENCES public.teams(id),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  pub_id TEXT REFERENCES public.pubs(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id TEXT NOT NULL REFERENCES public.teams(id),
  match_id TEXT NOT NULL REFERENCES public.matches(id),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL REFERENCES public.players(id),
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.match_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id TEXT NOT NULL REFERENCES public.matches(id),
  team_id TEXT NOT NULL REFERENCES public.teams(id),
  player_id TEXT NOT NULL REFERENCES public.players(id),
  pub_id TEXT REFERENCES public.pubs(id),
  pub_name TEXT,
  attended_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  match_label TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_identities_match ON public.user_identities(match_id);
CREATE INDEX IF NOT EXISTS idx_fan_presence_match ON public.fan_presence(match_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_team_match ON public.chat_messages(team_id, match_id, created_at);
CREATE INDEX IF NOT EXISTS idx_match_history_user ON public.match_history(user_id, attended_at DESC);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fan_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_authenticated ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY teams_public_read ON public.teams
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY pubs_public_read ON public.pubs
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY matches_public_read ON public.matches
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY players_public_read ON public.players
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY user_identities_select_own ON public.user_identities
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY user_identities_insert_own ON public.user_identities
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY user_identities_update_own ON public.user_identities
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY fan_presence_select_authenticated ON public.fan_presence
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY fan_presence_upsert_own ON public.fan_presence
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY fan_presence_update_own ON public.fan_presence
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY chat_messages_select_team ON public.chat_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_identities ui
      WHERE ui.user_id = (SELECT auth.uid())
        AND ui.match_id = chat_messages.match_id
        AND ui.team_id = chat_messages.team_id
    )
  );

CREATE POLICY chat_messages_insert_team ON public.chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.user_identities ui
      WHERE ui.user_id = (SELECT auth.uid())
        AND ui.match_id = chat_messages.match_id
        AND ui.team_id = chat_messages.team_id
    )
  );

CREATE POLICY match_history_select_own ON public.match_history
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY match_history_insert_own ON public.match_history
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY match_history_update_own ON public.match_history
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY match_history_delete_own ON public.match_history
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, fan_since)
  VALUES (
    NEW.id,
    COALESCE(NEW.profile->>'name', split_part(NEW.email, '@', 1), 'Fan'),
    NEW.profile->>'avatar_url',
    COALESCE(NEW.created_at, NOW())
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_profile();
