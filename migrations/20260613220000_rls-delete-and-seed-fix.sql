-- RLS DELETE policies for account cleanup + seed label fix

CREATE POLICY user_identities_delete_own ON public.user_identities
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY fan_presence_delete_own ON public.fan_presence
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY chat_messages_delete_own ON public.chat_messages
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY profiles_delete_own ON public.profiles
  FOR DELETE TO authenticated
  USING (id = (SELECT auth.uid()));

-- Upcoming fixture uses Spain/France rosters; clarify venue label (id kept for JSON parity)
UPDATE public.matches
SET venue = 'Spain vs France — Oracle Park Watch Party'
WHERE id = 'match-england-germany';
