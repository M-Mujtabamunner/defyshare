import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CHECKOUT_URLS, planById, type PlanId } from '@/lib/plans';
import { openCheckout, preloadCheckout } from '@/lib/lemon';
import { setPlanAuthProvider } from '@/lib/storageUrls';

const LICENSE_KEY = 'defyshare:license';
const PLAN_CACHE = 'defyshare:plan';
const PENDING_KEY = 'defyshare:pending-plan';

export interface PlanStatus {
  plan: PlanId;
  limit: number;
  source?: 'license' | 'subscription';
  email?: string | null;
  renewsAt?: string | null;
  endsAt?: string | null;
  expiresAt?: string | null;
  portalUrl?: string | null;
  licenseError?: string;
  error?: string;
}

const FREE: PlanStatus = { plan: 'free', limit: planById('free').limit };

const read = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const write = (k: string, v: string | null) => {
  try {
    if (v === null) localStorage.removeItem(k);
    else localStorage.setItem(k, v);
  } catch {
    /* storage blocked */
  }
};

const readCachedPlan = (): PlanStatus => {
  try {
    const p = JSON.parse(read(PLAN_CACHE) || 'null') as PlanStatus | null;
    return p?.plan ? { ...p, limit: planById(p.plan).limit } : FREE;
  } catch {
    return FREE;
  }
};

export const signInWithGoogle = () =>
  supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + window.location.pathname },
  });

async function fetchPlan(body: { token?: string; license?: string; refresh?: boolean }): Promise<PlanStatus> {
  const res = await fetch('/api/plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`plan check failed (${res.status})`);
  return (await res.json()) as PlanStatus;
}

type ActivateResult = { ok: true; plan: PlanId } | { ok: false; error: string };

interface PlanContextValue extends PlanStatus {
  checking: boolean;
  license: string | null;
  signedIn: boolean;
  plansOpen: boolean;
  setPlansOpen: (open: boolean) => void;
  /** Sign in first if needed, then open the Lemon Squeezy checkout. */
  choosePlan: (plan: PlanId) => Promise<'checkout' | 'signin' | 'unavailable'>;
  activateLicense: (key: string) => Promise<ActivateResult>;
  removeLicense: () => void;
  refresh: (force?: boolean) => Promise<void>;
}

const PlanContext = createContext<PlanContextValue | null>(null);

export const PlanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, user } = useAuth();
  const [status, setStatus] = useState<PlanStatus>(readCachedPlan);
  const [license, setLicense] = useState<string | null>(() => read(LICENSE_KEY));
  const [checking, setChecking] = useState(false);
  const [plansOpen, setPlansOpen] = useState(false);
  const tokenRef = useRef<string | undefined>();
  tokenRef.current = session?.access_token;
  const licenseRef = useRef(license);
  licenseRef.current = license;

  // Every upload signing request carries the proof of plan.
  useEffect(() => {
    setPlanAuthProvider(async () => {
      const { data } = await supabase.auth.getSession();
      return { token: data.session?.access_token, license: licenseRef.current ?? undefined };
    });
  }, []);

  const apply = useCallback((s: PlanStatus) => {
    setStatus(s);
    write(PLAN_CACHE, s.plan === 'free' ? null : JSON.stringify(s));
  }, []);

  const refresh = useCallback(
    async (force = false) => {
      const token = tokenRef.current;
      const lic = licenseRef.current ?? undefined;
      if (!token && !lic) {
        apply(FREE);
        return;
      }
      setChecking(true);
      try {
        apply(await fetchPlan({ token, license: lic, refresh: force }));
      } catch {
        /* offline: keep the last known plan */
      } finally {
        setChecking(false);
      }
    },
    [apply],
  );

  useEffect(() => {
    refresh();
  }, [session?.access_token, license, refresh]);

  const startCheckout = useCallback(
    async (plan: PlanId) => {
      const url = CHECKOUT_URLS[plan];
      if (!url) return 'unavailable' as const;
      await openCheckout(url, {
        email: user?.email,
        name: (user?.user_metadata?.full_name as string) || null,
        userId: user?.id,
        onPaid: () => {
          // Lemon Squeezy needs a moment to create the subscription.
          [3000, 10000, 30000].forEach((ms) => setTimeout(() => refresh(true), ms));
        },
      });
      return 'checkout' as const;
    },
    [user, refresh],
  );

  const choosePlan = useCallback(
    async (plan: PlanId) => {
      if (!CHECKOUT_URLS[plan]) return 'unavailable' as const;
      if (!user) {
        write(PENDING_KEY, plan);
        await signInWithGoogle();
        return 'signin' as const;
      }
      setPlansOpen(false);
      return startCheckout(plan);
    },
    [user, startCheckout],
  );

  // Back from Google sign-in with a plan picked: continue to checkout.
  useEffect(() => {
    if (!user) return;
    const pending = read(PENDING_KEY) as PlanId | null;
    if (!pending) return;
    write(PENDING_KEY, null);
    startCheckout(pending);
  }, [user, startCheckout]);

  useEffect(() => {
    if (plansOpen) preloadCheckout();
  }, [plansOpen]);

  const activateLicense = useCallback(
    async (key: string): Promise<ActivateResult> => {
      const clean = key.trim();
      if (!/^[\w-]{8,100}$/.test(clean)) return { ok: false, error: 'license_invalid' };
      try {
        const res = await fetchPlan({ license: clean, token: tokenRef.current, refresh: true });
        if (res.source !== 'license' && res.licenseError) return { ok: false, error: res.licenseError };
        if (res.plan === 'free') return { ok: false, error: res.licenseError || res.error || 'license_invalid' };
        write(LICENSE_KEY, clean);
        setLicense(clean);
        apply(res);
        return { ok: true, plan: res.plan };
      } catch {
        return { ok: false, error: 'license_check_failed' };
      }
    },
    [apply],
  );

  const removeLicense = useCallback(() => {
    write(LICENSE_KEY, null);
    setLicense(null);
  }, []);

  const value = useMemo<PlanContextValue>(
    () => ({
      ...status,
      checking,
      license,
      signedIn: Boolean(user),
      plansOpen,
      setPlansOpen,
      choosePlan,
      activateLicense,
      removeLicense,
      refresh,
    }),
    [status, checking, license, user, plansOpen, choosePlan, activateLicense, removeLicense, refresh],
  );

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
};

export const usePlan = () => {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan must be used inside PlanProvider');
  return ctx;
};
