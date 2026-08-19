-- Fixtures, teams and players are now served from live providers
-- (football-data.org / API-Football / SportMonks) via the day cache, so the
-- local `matches`, `teams` and `players` tables are no longer the source of
-- truth. The foreign keys below rejected every identity / chat / presence row
-- for an externally-sourced match id (e.g. `fd-564628`), which silently broke
-- joining a squad and sending team chat messages.
--
-- These columns stay as plain text external identifiers.

ALTER TABLE user_identities DROP CONSTRAINT IF EXISTS user_identities_match_id_fkey;
ALTER TABLE user_identities DROP CONSTRAINT IF EXISTS user_identities_team_id_fkey;
ALTER TABLE user_identities DROP CONSTRAINT IF EXISTS user_identities_player_id_fkey;

ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_match_id_fkey;
ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_team_id_fkey;
ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_player_id_fkey;

ALTER TABLE fan_presence DROP CONSTRAINT IF EXISTS fan_presence_match_id_fkey;
ALTER TABLE fan_presence DROP CONSTRAINT IF EXISTS fan_presence_team_id_fkey;
ALTER TABLE fan_presence DROP CONSTRAINT IF EXISTS fan_presence_player_id_fkey;

-- Lookups now filter on these columns without a FK index behind them.
CREATE INDEX IF NOT EXISTS user_identities_match_team_idx
  ON user_identities (match_id, team_id);
CREATE INDEX IF NOT EXISTS chat_messages_match_team_idx
  ON chat_messages (match_id, team_id, created_at);
