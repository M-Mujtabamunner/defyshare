
REVOKE EXECUTE ON FUNCTION public.is_blocked(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_friend(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_conversation_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_conversation_admin(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.touch_promo_overrides() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.is_blocked(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_friend(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_conversation_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_conversation_admin(uuid, uuid) TO authenticated;
