
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS xp integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS level integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS theme text NOT NULL DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS accent_color text NOT NULL DEFAULT '#ec4899';

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS reactions jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.friendships
  ADD COLUMN IF NOT EXISTS is_favorite boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS relationship_type text NOT NULL DEFAULT 'friend';

-- Function: add XP and recompute level (level = floor(sqrt(xp/10)) + 1)
CREATE OR REPLACE FUNCTION public.add_xp(_user_id uuid, _amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_xp integer;
BEGIN
  UPDATE public.profiles
    SET xp = xp + _amount,
        level = GREATEST(1, floor(sqrt((xp + _amount) / 10.0))::int + 1)
    WHERE id = _user_id;
END;
$$;

-- Trigger: auto add 5 XP per message sent
CREATE OR REPLACE FUNCTION public.message_xp_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.add_xp(NEW.sender_id, 5);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS messages_award_xp ON public.messages;
CREATE TRIGGER messages_award_xp
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.message_xp_trigger();
