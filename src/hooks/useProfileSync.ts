import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Upserts the signed-in Google user's profile so they're discoverable in the
 * friends system. Also bumps last_seen.
 */
export const useProfileSync = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    const name =
      (meta.full_name as string) ||
      (meta.name as string) ||
      user.email?.split('@')[0] ||
      'User';
    const photo = (meta.avatar_url as string) || (meta.picture as string) || null;
    supabase
      .from('profiles')
      .upsert(
        {
          user_id: user.id,
          google_name: name,
          google_email: user.email ?? null,
          google_photo: photo,
          last_seen: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      )
      .then(() => {});
  }, [user]);
};
