-- Lock down public.rooms: it was globally readable/insertable, letting anyone
-- enumerate active room_keys across all networks. The app derives room_key
-- from the client's IP directly and reads shared_files by room_key; it does
-- not query or insert into public.rooms from the browser, so remove all
-- anon/authenticated access and keep the table for service-role use only.

DROP POLICY IF EXISTS "Anyone can view rooms" ON public.rooms;
DROP POLICY IF EXISTS "Anyone can create rooms" ON public.rooms;

REVOKE ALL ON public.rooms FROM anon, authenticated;
GRANT ALL ON public.rooms TO service_role;

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
-- No policies for anon/authenticated => default deny.