
-- ============================================================
-- 1. Admin role system
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own roles" ON public.user_roles;
CREATE POLICY "Users can read their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin'::public.app_role);
$$;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

-- Seed existing admin emails (from src/lib/admin.ts) by joining to auth.users
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::public.app_role
FROM auth.users u
WHERE lower(u.email) IN (
  'mujtabamuneer777@gmail.com',
  'chadxkid@gmail.com',
  'twocousins7777@gmail.com',
  'mehroz.muneer@gmail.com',
  'mmahadmuneer@gmail.com',
  'info@defyscale.com'
)
ON CONFLICT (user_id, role) DO NOTHING;

-- ============================================================
-- 2. friend_requests: only receiver can update status
-- ============================================================
DROP POLICY IF EXISTS "Sender or receiver update request" ON public.friend_requests;
CREATE POLICY "Receiver updates request status"
  ON public.friend_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- ============================================================
-- 3. profiles: restrict SELECT to self / friends / conv members / pending requests
-- ============================================================
DROP POLICY IF EXISTS "Authenticated can read profiles" ON public.profiles;
CREATE POLICY "Profiles visible to related users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (SELECT 1 FROM public.friends f
               WHERE f.user_id = auth.uid() AND f.friend_id = profiles.user_id)
    OR EXISTS (SELECT 1 FROM public.conversation_members m1
               JOIN public.conversation_members m2
                 ON m1.conversation_id = m2.conversation_id
               WHERE m1.user_id = auth.uid() AND m2.user_id = profiles.user_id)
    OR EXISTS (SELECT 1 FROM public.friend_requests r
               WHERE (r.sender_id = auth.uid() AND r.receiver_id = profiles.user_id)
                  OR (r.receiver_id = auth.uid() AND r.sender_id = profiles.user_id))
  );

-- Search RPC so users can still discover new people without broad SELECT access.
CREATE OR REPLACE FUNCTION public.search_profiles(_q text)
RETURNS TABLE (
  user_id uuid,
  google_name text,
  google_email text,
  google_photo text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.user_id, p.google_name, p.google_email, p.google_photo
  FROM public.profiles p
  WHERE auth.uid() IS NOT NULL
    AND p.user_id <> auth.uid()
    AND length(btrim(_q)) >= 2
    AND (p.google_email ILIKE '%' || _q || '%' OR p.google_name ILIKE '%' || _q || '%')
    AND NOT EXISTS (
      SELECT 1 FROM public.friends f
      WHERE f.user_id = auth.uid() AND f.friend_id = p.user_id
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.blocked_users b
      WHERE (b.blocker_id = auth.uid() AND b.blocked_user_id = p.user_id)
         OR (b.blocker_id = p.user_id AND b.blocked_user_id = auth.uid())
    )
  LIMIT 20;
$$;
REVOKE ALL ON FUNCTION public.search_profiles(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_profiles(text) TO authenticated;

-- ============================================================
-- 4. file_history: admins only
-- ============================================================
DROP POLICY IF EXISTS "Authenticated can read file history" ON public.file_history;
CREATE POLICY "Admins read file history"
  ON public.file_history FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
