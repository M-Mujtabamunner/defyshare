import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const VALID_PROMO = 'defyscale0110';

// null = Forever (no expiry). Otherwise seconds from upload time.
export const DURATION_OPTIONS: { label: string; seconds: number | null }[] = [
  { label: '1 hour', seconds: 60 * 60 },
  { label: '2 hours', seconds: 2 * 60 * 60 },
  { label: '5 hours', seconds: 5 * 60 * 60 },
  { label: '10 hours', seconds: 10 * 60 * 60 },
  { label: '15 hours', seconds: 15 * 60 * 60 },
  { label: '30 hours', seconds: 30 * 60 * 60 },
  { label: '3 days', seconds: 3 * 24 * 60 * 60 },
  { label: '15 days', seconds: 15 * 24 * 60 * 60 },
  { label: 'Forever', seconds: null },
];

export const usePromoOverride = () => {
  const { user } = useAuth();
  const [keepForever, setKeepForever] = useState(false);
  const [overrideSeconds, setOverrideSecondsState] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setKeepForever(false);
      setOverrideSecondsState(null);
      return;
    }
    let active = true;
    setLoading(true);
    supabase
      .from('promo_overrides')
      .select('keep_forever, override_seconds')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setKeepForever(!!data?.keep_forever);
        setOverrideSecondsState(
          (data as { override_seconds?: number | null } | null)?.override_seconds ?? null,
        );
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

  const applyPromo = useCallback(
    async (code: string): Promise<{ ok: boolean; reason?: string }> => {
      if (!user) return { ok: false, reason: 'Sign in with Google first' };
      if (code.trim().toLowerCase() !== VALID_PROMO) {
        return { ok: false, reason: 'Invalid promo code' };
      }
      const { error } = await supabase.from('promo_overrides').upsert({
        user_id: user.id,
        keep_forever: true,
        promo_code: code.trim().toLowerCase(),
        override_seconds: null,
      });
      if (error) return { ok: false, reason: error.message };
      setKeepForever(true);
      setOverrideSecondsState(null);
      return { ok: true };
    },
    [user],
  );

  const setOverrideSeconds = useCallback(
    async (seconds: number | null) => {
      setOverrideSecondsState(seconds);
      if (!user) return;
      await supabase.from('promo_overrides').upsert({
        user_id: user.id,
        keep_forever: true,
        override_seconds: seconds,
      });
    },
    [user],
  );

  return {
    keepForever,
    overrideSeconds,
    setOverrideSeconds,
    loading,
    applyPromo,
    signedIn: !!user,
  };
};
