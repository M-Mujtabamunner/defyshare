CREATE OR REPLACE FUNCTION public.create_group_conversation(
  _name text,
  _member_ids uuid[],
  _photo text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  new_id uuid;
  m uuid;
BEGIN
  IF me IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF _name IS NULL OR length(btrim(_name)) = 0 THEN
    RAISE EXCEPTION 'group name required';
  END IF;

  INSERT INTO public.conversations (type) VALUES ('group') RETURNING id INTO new_id;

  INSERT INTO public.conversation_members (conversation_id, user_id, role)
    VALUES (new_id, me, 'admin');

  IF _member_ids IS NOT NULL THEN
    FOREACH m IN ARRAY _member_ids LOOP
      IF m IS NOT NULL AND m <> me THEN
        INSERT INTO public.conversation_members (conversation_id, user_id, role)
          VALUES (new_id, m, 'member')
          ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END IF;

  INSERT INTO public.groups (conversation_id, group_name, group_photo, created_by)
    VALUES (new_id, btrim(_name), _photo, me);

  RETURN new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_group_conversation(text, uuid[], text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_group_conversation(text, uuid[], text) TO authenticated;