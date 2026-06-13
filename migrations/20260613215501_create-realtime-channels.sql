-- Realtime channels + publish triggers for presence and chat

INSERT INTO realtime.channels (pattern, description, enabled)
VALUES
  ('presence:match:%', 'Live fan location updates per match', true),
  ('chat:team:%', 'Team chat messages', true)
ON CONFLICT (pattern) DO UPDATE
SET description = EXCLUDED.description,
    enabled = EXCLUDED.enabled;

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
      'lat', NEW.lat,
      'lng', NEW.lng,
      'pubId', NEW.pub_id,
      'updatedAt', NEW.updated_at
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS fan_presence_notify ON public.fan_presence;
CREATE TRIGGER fan_presence_notify
  AFTER INSERT OR UPDATE ON public.fan_presence
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_fan_presence();

CREATE OR REPLACE FUNCTION public.notify_chat_message()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM realtime.publish(
    'chat:team:' || NEW.team_id || ':match:' || NEW.match_id,
    'chat_message',
    jsonb_build_object(
      'id', NEW.id,
      'teamId', NEW.team_id,
      'matchId', NEW.match_id,
      'userId', NEW.user_id,
      'playerId', NEW.player_id,
      'text', NEW.text,
      'createdAt', NEW.created_at
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS chat_messages_notify ON public.chat_messages;
CREATE TRIGGER chat_messages_notify
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_chat_message();
