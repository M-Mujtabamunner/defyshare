
-- 1. Admins can delete their group conversation
DROP POLICY IF EXISTS "Admins delete group conversation" ON public.conversations;
CREATE POLICY "Admins delete group conversation"
ON public.conversations
FOR DELETE
TO authenticated
USING (public.is_conversation_admin(id, auth.uid()));

-- 2. Message expiry column + trigger
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

CREATE INDEX IF NOT EXISTS messages_expires_at_idx ON public.messages(expires_at);

CREATE OR REPLACE FUNCTION public.set_message_expiry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ov_keep boolean;
  ov_sec bigint;
BEGIN
  SELECT keep_forever, override_seconds
    INTO ov_keep, ov_sec
  FROM public.promo_overrides
  WHERE user_id = NEW.sender_id;

  IF ov_keep IS TRUE AND (ov_sec IS NULL OR ov_sec <= 0) THEN
    NEW.expires_at := NULL;
  ELSIF ov_sec IS NOT NULL AND ov_sec > 0 THEN
    NEW.expires_at := now() + make_interval(secs => ov_sec);
  ELSE
    NEW.expires_at := now() + interval '30 hours';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS messages_set_expiry ON public.messages;
CREATE TRIGGER messages_set_expiry
BEFORE INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.set_message_expiry();

UPDATE public.messages
   SET expires_at = created_at + interval '30 hours'
 WHERE expires_at IS NULL;

-- 3. shared_texts expiry
ALTER TABLE public.shared_texts
  ADD COLUMN IF NOT EXISTS expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 hours');
CREATE INDEX IF NOT EXISTS shared_texts_expires_at_idx ON public.shared_texts(expires_at);

-- 4. Cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_expired()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.messages
    WHERE expires_at IS NOT NULL AND expires_at < now();
  DELETE FROM public.shared_files
    WHERE keep_forever = false AND expires_at < now();
  DELETE FROM public.shared_texts
    WHERE expires_at < now();
END;
$$;

-- 5. Schedule cron cleanup
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  PERFORM cron.unschedule(jobid)
  FROM cron.job
  WHERE jobname = 'cleanup-expired-defyshare';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'cleanup-expired-defyshare',
  '*/10 * * * *',
  $$SELECT public.cleanup_expired()$$
);

-- 6. Message reactions
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id, emoji)
);

GRANT SELECT, INSERT, DELETE ON public.message_reactions TO authenticated;
GRANT ALL ON public.message_reactions TO service_role;

ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members read reactions" ON public.message_reactions;
CREATE POLICY "Members read reactions"
ON public.message_reactions
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.id = message_id
      AND public.is_conversation_member(m.conversation_id, auth.uid())
  )
);

DROP POLICY IF EXISTS "Members add reactions" ON public.message_reactions;
CREATE POLICY "Members add reactions"
ON public.message_reactions
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.id = message_id
      AND public.is_conversation_member(m.conversation_id, auth.uid())
  )
);

DROP POLICY IF EXISTS "Users remove own reactions" ON public.message_reactions;
CREATE POLICY "Users remove own reactions"
ON public.message_reactions
FOR DELETE TO authenticated
USING (user_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
