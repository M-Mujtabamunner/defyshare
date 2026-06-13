import { supabase } from '@/integrations/supabase/client';

/**
 * Server-side admin check. The admin role lives in `public.user_roles`
 * and is enforced through RLS — there is no email allowlist in the client bundle.
 */
export const checkIsAdmin = async (): Promise<boolean> => {
  const { data, error } = await supabase.rpc('is_admin');
  if (error) return false;
  return Boolean(data);
};
