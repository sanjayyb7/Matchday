-- One Google account = one live persona. Chat history keeps the player_id
-- captured at send time; the live squad rail only reads user_identities.

DELETE FROM public.user_identities ui
WHERE ui.id NOT IN (
  SELECT kept.id
  FROM (
    SELECT DISTINCT ON (user_id) id
    FROM public.user_identities
    ORDER BY user_id, updated_at DESC
  ) kept
);

ALTER TABLE public.user_identities
  DROP CONSTRAINT IF EXISTS user_identities_user_id_match_id_key;

DROP INDEX IF EXISTS user_identities_user_id_match_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS user_identities_user_id_uidx
  ON public.user_identities (user_id);

-- Tell other clients immediately when someone leaves the map / squad.
CREATE OR REPLACE FUNCTION public.notify_fan_presence_delete()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM realtime.publish(
    'presence:match:' || OLD.match_id,
    'presence_cleared',
    jsonb_build_object(
      'userId', OLD.user_id,
      'matchId', OLD.match_id
    )
  );
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS fan_presence_delete_notify ON public.fan_presence;
CREATE TRIGGER fan_presence_delete_notify
  AFTER DELETE ON public.fan_presence
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_fan_presence_delete();

CREATE OR REPLACE FUNCTION public.notify_fan_presence()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM realtime.publish(
    'presence:match:' || NEW.match_id,
    'presence_updated',
    jsonb_build_object(
      'userId', NEW.user_id,
      'playerId', NEW.player_id,
      'teamId', NEW.team_id,
      'matchId', NEW.match_id,
      'lat', NEW.lat,
      'lng', NEW.lng,
      'pubId', NEW.pub_id,
      'updatedAt', NEW.updated_at
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
