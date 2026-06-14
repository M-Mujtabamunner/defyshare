
CREATE OR REPLACE FUNCTION public.find_profile_by_email(_email text)
RETURNS TABLE(user_id uuid, google_name text, google_email text, google_photo text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.google_name, p.google_email, p.google_photo
  FROM public.profiles p
  WHERE auth.uid() IS NOT NULL
    AND length(btrim(_email)) > 0
    AND p.google_email ILIKE btrim(_email)
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.find_profile_by_email(text) TO authenticated;
