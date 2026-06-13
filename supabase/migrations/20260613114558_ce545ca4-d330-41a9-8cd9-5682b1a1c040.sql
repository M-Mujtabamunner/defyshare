CREATE OR REPLACE FUNCTION public.accept_friend_request(_req_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r public.friend_requests%ROWTYPE;
BEGIN
  SELECT * INTO r FROM public.friend_requests WHERE id = _req_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'request not found';
  END IF;
  IF r.receiver_id <> auth.uid() THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  UPDATE public.friend_requests
    SET status = 'accepted', is_read = true
    WHERE id = _req_id;

  INSERT INTO public.friends (user_id, friend_id)
    VALUES (r.sender_id, r.receiver_id)
    ON CONFLICT (user_id, friend_id) DO NOTHING;
  INSERT INTO public.friends (user_id, friend_id)
    VALUES (r.receiver_id, r.sender_id)
    ON CONFLICT (user_id, friend_id) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_friend_request(uuid) TO authenticated;