import React, { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePlan } from '@/hooks/usePlan';
import { useToast } from '@/hooks/use-toast';
import { CHECKOUT_URLS, PLANS, RANK, type PlanId } from '@/lib/plans';
import { cn } from '@/lib/utils';

export const GoogleG = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.4 29 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5c10.8 0 19.5-8.7 19.5-19.5 0-1.3-.1-2.3-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.1l6.6 4.8C14.7 15.3 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.4 29 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.1z" />
    <path fill="#4CAF50" d="M24 43.5c5 0 9.5-1.9 12.9-5l-6-5c-1.9 1.4-4.3 2.2-6.9 2.2-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.5 39 16.2 43.5 24 43.5z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6 5c-.4.4 6.7-4.9 6.7-14.5 0-1.3-.1-2.3-.4-3.5z" />
  </svg>
);

/** Free / Plus / Pro cards. Picking a paid plan signs in with Google first, then opens checkout. */
export const PlanCards: React.FC<{ highlight?: PlanId }> = ({ highlight = 'pro' }) => {
  const { plan: current, choosePlan } = usePlan();
  const { toast } = useToast();
  const [busy, setBusy] = useState<PlanId | null>(null);

  const pick = async (id: PlanId) => {
    setBusy(id);
    try {
      const res = await choosePlan(id);
      if (res === 'unavailable') toast({ title: 'Checkout is not set up yet', description: 'Please try again soon.' });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {PLANS.map((p) => {
        const isCurrent = p.id === current;
        const featured = p.id === highlight && !isCurrent;
        const lower = RANK[p.id] < RANK[current];
        return (
          <div
            key={p.id}
            className={cn(
              'relative flex flex-col rounded-2xl border bg-card p-5 transition-colors',
              featured ? 'border-foreground' : 'border-border',
            )}
          >
            {featured && (
              <span className="absolute -top-3 start-5 rounded-full bg-foreground px-2.5 py-1 text-xs font-medium text-background">Best value</span>
            )}
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-lg font-medium">{p.name}</h3>
              <div className="text-end">
                <span className="text-2xl font-medium tracking-tight tabular-nums">{p.price}</span>
                {p.id !== 'free' && <span className="text-xs text-muted-foreground">/mo</span>}
              </div>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{p.blurb}</p>
            <ul className="mt-4 space-y-2 text-sm flex-1">
              {p.features.map((f, i) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                  <span className={cn(i === 0 && 'font-medium')}>{f}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5">
              {isCurrent ? (
                <Button variant="secondary" className="w-full h-11 rounded-full" disabled>
                  Current plan
                </Button>
              ) : p.id === 'free' || lower ? (
                <Button variant="outline" className="w-full h-11 rounded-full" disabled>
                  {p.id === 'free' ? 'Free forever' : 'Included'}
                </Button>
              ) : (
                <Button
                  className={cn('w-full h-11 gap-2 rounded-full', featured && 'bg-foreground text-background hover:bg-foreground/85')}
                  variant={featured ? 'default' : 'outline'}
                  disabled={busy !== null || !CHECKOUT_URLS[p.id]}
                  onClick={() => pick(p.id)}
                >
                  {busy === p.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : null}
                  Get {p.name}
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/** Plans dialog, opened from the header badge, the settings or when a file is too big. */
export const PlansDialog: React.FC = () => {
  const { plansOpen, setPlansOpen } = usePlan();
  return (
    <Dialog open={plansOpen} onOpenChange={setPlansOpen}>
      <DialogContent className="max-w-3xl max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send bigger files</DialogTitle>
          <DialogDescription>
            Same DefyShare, bigger uploads. Original quality, no app, cancel anytime. Payments are handled securely by Lemon Squeezy.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-3">
          <PlanCards />
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Already bought a plan? Paste your license key in Settings.
        </p>
      </DialogContent>
    </Dialog>
  );
};
