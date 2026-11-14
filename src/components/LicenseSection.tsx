import React, { useState } from 'react';
import { KeyRound, Loader2, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlan } from '@/hooks/usePlan';
import { useToast } from '@/hooks/use-toast';
import { formatLimit, planById } from '@/lib/plans';
import { cn } from '@/lib/utils';

const ERRORS: Record<string, string> = {
  license_invalid: "That key isn't valid. Check it and try again.",
  license_expired: 'This license has expired. Renew it in your Lemon Squeezy account.',
  license_disabled: 'This license has been disabled.',
  license_check_failed: "Couldn't check the key right now. Try again in a moment.",
};

const mask = (k: string) => (k.length > 8 ? `${k.slice(0, 4)}••••${k.slice(-4)}` : k);

/** Settings: current plan, upgrade, and paste a Lemon Squeezy license key. */
const LicenseSection: React.FC = () => {
  const { plan, limit, source, license, activateLicense, removeLicense, setPlansOpen, renewsAt, endsAt } = usePlan();
  const { toast } = useToast();
  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const paid = plan !== 'free';

  const activate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim() || busy) return;
    setBusy(true);
    setError(null);
    const res = await activateLicense(key);
    setBusy(false);
    if (res.ok) {
      setKey('');
      toast({ title: `${planById(res.plan).name} unlocked 🎉`, description: `You can now send files up to ${formatLimit(planById(res.plan).limit)}.` });
    } else if ('error' in res) {
      setError(ERRORS[res.error] ?? ERRORS.license_invalid);
    }
  };

  const until = endsAt && !renewsAt ? new Date(endsAt).toLocaleDateString() : null;

  return (
    <section className="space-y-3">
      <h3 className="text-xs font-medium text-muted-foreground">Plan</h3>
      <div className={cn('rounded-xl border p-3', paid ? 'border-primary/40 bg-primary/5' : 'border-border')}>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-semibold">{planById(plan).name}</div>
            <div className="text-xs text-muted-foreground">
              Files up to {formatLimit(limit)}
              {source === 'subscription' && ' · via your Google account'}
              {source === 'license' && ' · via license key'}
              {until && ` · until ${until}`}
            </div>
          </div>
          {plan !== 'pro' && (
            <Button size="sm" className="gap-1.5 shrink-0" onClick={() => setPlansOpen(true)}>
              <Sparkles className="w-3.5 h-3.5" />
              Upgrade
            </Button>
          )}
        </div>
      </div>

      {license ? (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
          <span className="inline-flex items-center gap-2 min-w-0">
            <KeyRound className="w-4 h-4 text-primary shrink-0" />
            <span className="font-mono truncate">{mask(license)}</span>
          </span>
          <button
            type="button"
            onClick={removeLicense}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
          >
            <X className="w-3.5 h-3.5" />
            Remove
          </button>
        </div>
      ) : (
        <form onSubmit={activate} className="space-y-1.5">
          <label htmlFor="license" className="text-sm font-medium">
            License key
          </label>
          <div className="flex gap-2">
            <input
              id="license"
              value={key}
              onChange={(e) => {
                setKey(e.target.value);
                setError(null);
              }}
              placeholder="Paste your license key"
              autoComplete="off"
              spellCheck={false}
              className="min-w-0 flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
            <Button type="submit" size="sm" className="h-9" disabled={!key.trim() || busy}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Activate'}
            </Button>
          </div>
          {error ? (
            <p className="text-xs text-destructive">{error}</p>
          ) : (
            <p className="text-xs text-muted-foreground">It's in your purchase email from Lemon Squeezy. Use the same key on each of your devices.</p>
          )}
        </form>
      )}
    </section>
  );
};

export default LicenseSection;
