-- Allow authenticated users to see other people's identities for a
-- match+team where they themselves have joined. This powers the
-- "Live squad" rail on the team chat so both users see each other.
CREATE POLICY user_identities_select_squad ON user_identities
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM user_identities mine
      WHERE mine.user_id = (SELECT auth.uid())
        AND mine.match_id = user_identities.match_id
        AND mine.team_id = user_identities.team_id
    )
  );
