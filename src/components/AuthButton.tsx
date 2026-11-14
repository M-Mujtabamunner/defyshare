import React, { useState } from 'react';
import { CreditCard, Loader2, LogOut, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { signInWithGoogle, usePlan } from '@/hooks/usePlan';
import { useToast } from '@/hooks/use-toast';
import { GoogleG } from '@/components/PlanCards';
import { formatLimit, planById } from '@/lib/plans';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/** Header "Sign in with Google" button; once signed in, an avatar menu with the plan. */
const AuthButton: React.FC = () => {
  const { user } = useAuth();
  const { plan, limit, portalUrl, setPlansOpen } = usePlan();
  const { toast } = useToast();
  const [signingIn, setSigningIn] = useState(false);

  const signIn = async () => {
    if (signingIn) return;
    setSigningIn(true);
    const { error } = await signInWithGoogle();
    if (error) {
      toast({ title: 'Sign-in failed', description: error.message, variant: 'destructive' });
      setSigningIn(false);
    }
    // On success the browser goes to Google, so keep the spinner.
  };

  if (!user) {
    return (
      <button
        type="button"
        onClick={signIn}
        disabled={signingIn}
        aria-label="Sign in with Google"
        title="Sign in with Google"
        className="inline-flex items-center justify-center gap-2 h-8 sm:h-9 w-8 sm:w-auto sm:px-3 rounded-full border border-border/70 bg-card hover:bg-secondary text-sm font-medium transition-colors disabled:opacity-70"
      >
        {signingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleG />}
        <span className="hidden sm:inline">Sign in</span>
      </button>
    );
  }

  const name = (user.user_metadata?.full_name as string) || user.email || 'Account';
  const avatar = user.user_metadata?.avatar_url as string | undefined;
  const paid = plan !== 'free';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account"
          className="relative grid place-items-center w-8 h-8 sm:w-9 sm:h-9 rounded-full hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {avatar ? (
            <img src={avatar} alt="" referrerPolicy="no-referrer" className="w-6 h-6 sm:w-7 sm:h-7 rounded-full" />
          ) : (
            <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary text-primary-foreground text-xs font-semibold grid place-items-center">
              {name.charAt(0).toUpperCase()}
            </span>
          )}
          {paid && (
            <span className="absolute -bottom-0.5 -end-0.5 rounded-full bg-primary px-1 text-[8px] font-bold leading-[13px] text-primary-foreground ring-2 ring-background uppercase">
              {plan}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>
          <div className="font-medium truncate">{name}</div>
          <div className="text-xs font-normal text-muted-foreground truncate">{user.email}</div>
          <div className={cn('mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs', paid ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground')}>
            {planById(plan).name} · up to {formatLimit(limit)}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {plan !== 'pro' && (
          <DropdownMenuItem onClick={() => setPlansOpen(true)} className="gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            {paid ? 'Upgrade to Pro' : 'Upgrade'}
          </DropdownMenuItem>
        )}
        {portalUrl && (
          <DropdownMenuItem asChild className="gap-2">
            <a href={portalUrl} target="_blank" rel="noopener noreferrer">
              <CreditCard className="w-4 h-4" />
              Manage subscription
            </a>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={async () => {
            await supabase.auth.signOut();
            toast({ title: 'Signed out' });
          }}
          className="gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AuthButton;
