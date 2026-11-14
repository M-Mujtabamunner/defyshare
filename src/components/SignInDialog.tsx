import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { signInWithGoogle, usePlan } from '@/hooks/usePlan';
import { useTheme } from '@/components/ThemeProvider';
import { GoogleG } from '@/components/PlanCards';

// Google Identity Services: the sign-in happens on defyshare.app itself, so Google
// shows "DefyShare" instead of the database address that the redirect flow shows.
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

type GoogleId = {
  initialize: (o: Record<string, unknown>) => void;
  renderButton: (el: HTMLElement, o: Record<string, unknown>) => void;
};
declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

let gisLoading: Promise<boolean> | null = null;
const loadGis = () =>
  (gisLoading ??= new Promise<boolean>((resolve) => {
    if (window.google?.accounts?.id) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => resolve(Boolean(window.google?.accounts?.id));
    s.onerror = () => {
      gisLoading = null;
      resolve(false);
    };
    document.head.appendChild(s);
  }));

const sha256Hex = async (s: string) =>
  [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Google button rendered by Google; falls back to the redirect flow. */
const GoogleButton: React.FC<{ onError: (msg: string) => void }> = ({ onError }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { resolved } = useTheme();
  const [ready, setReady] = useState<boolean | null>(GOOGLE_CLIENT_ID ? null : false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let cancelled = false;
    (async () => {
      const ok = await loadGis();
      if (cancelled) return;
      if (!ok || !ref.current) return setReady(false);
      const raw = crypto.randomUUID() + crypto.randomUUID();
      window.google!.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        nonce: await sha256Hex(raw),
        use_fedcm_for_button: true,
        callback: async ({ credential }: { credential: string }) => {
          setBusy(true);
          const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: credential, nonce: raw });
          setBusy(false);
          if (error) onError(error.message);
        },
      });
      if (cancelled || !ref.current) return;
      window.google!.accounts.id.renderButton(ref.current, {
        type: 'standard',
        theme: resolved === 'dark' ? 'filled_black' : 'outline',
        size: 'large',
        shape: 'pill',
        text: 'continue_with',
        logo_alignment: 'center',
        width: Math.min(320, ref.current.offsetWidth || 320),
      });
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [resolved, onError]);

  if (ready === false) {
    return (
      <Button
        variant="outline"
        className="w-full h-11 rounded-full gap-2"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const { error } = await signInWithGoogle();
          if (error) {
            setBusy(false);
            onError(error.message);
          }
        }}
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleG />}
        Continue with Google
      </Button>
    );
  }
  return (
    <div className="relative flex justify-center min-h-[44px]">
      <div ref={ref} className="w-full flex justify-center" />
      {(ready === null || busy) && (
        <div className="absolute inset-0 grid place-items-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
};

/** One popup for both ways in: Google, or a link/code sent by email. */
const SignInDialog: React.FC = () => {
  const { signInOpen, setSignInOpen } = usePlan();
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!signInOpen) {
      setSentTo(null);
      setCode('');
      setError(null);
    }
  }, [signInOpen]);

  const sendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const address = email.trim().toLowerCase();
    if (!EMAIL_RE.test(address) || busy) return setError('Enter a valid email address.');
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithOtp({
      email: address,
      options: { emailRedirectTo: window.location.origin + window.location.pathname, shouldCreateUser: true },
    });
    setBusy(false);
    if (err) {
      setError(/rate|seconds/i.test(err.message) ? 'Too many emails. Wait a minute and try again.' : err.message);
      return;
    }
    setSentTo(address);
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sentTo || code.trim().length < 6 || busy) return;
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.verifyOtp({ email: sentTo, token: code.trim(), type: 'email' });
    setBusy(false);
    if (err) setError('That code is wrong or expired. Check the email or send a new one.');
  };

  return (
    <Dialog open={signInOpen} onOpenChange={setSignInOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="text-center sm:text-center">
          <DialogTitle>{sentTo ? 'Check your email' : 'Sign in to DefyShare'}</DialogTitle>
          <DialogDescription>
            {sentTo ? (
              <>
                We sent a sign-in link to <span className="font-medium text-foreground">{sentTo}</span>. Open it on this device, or enter the code from the email.
              </>
            ) : (
              'Sign in to get Plus or Pro on all your devices.'
            )}
          </DialogDescription>
        </DialogHeader>

        {sentTo ? (
          <form onSubmit={verify} className="space-y-3">
            <input
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, '').slice(0, 8));
                setError(null);
              }}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="Code from email"
              className="w-full h-11 rounded-full border border-input bg-background px-4 text-center text-lg tracking-[0.3em] font-mono focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
            <Button type="submit" className="w-full h-11 rounded-full" disabled={code.length < 6 || busy}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign in'}
            </Button>
            {error && <p className="text-xs text-center text-destructive">{error}</p>}
            <button
              type="button"
              onClick={() => setSentTo(null)}
              className="mx-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Use a different email
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <GoogleButton onError={setError} />
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
            </div>
            <form onSubmit={sendEmail} className="space-y-2">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full h-11 rounded-full border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
              <Button type="submit" variant="secondary" className="w-full h-11 rounded-full gap-2" disabled={!email.trim() || busy}>
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                Continue with email
              </Button>
            </form>
            {error && <p className="text-xs text-center text-destructive">{error}</p>}
            <p className="text-[11px] text-center text-muted-foreground">No password needed. Sharing files never needs an account.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SignInDialog;
