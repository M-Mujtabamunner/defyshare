import React from 'react';
import { Settings, Check, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { usePromoOverride, DURATION_OPTIONS } from '@/hooks/usePromoOverride';
import { useAuth } from '@/hooks/useAuth';
import { checkIsAdmin } from '@/lib/admin';

const NOTIF_KEY = 'defyshare:notifications';

const SettingsSheet: React.FC = () => {
  const [promo, setPromo] = React.useState('');
  const { toast } = useToast();
  const { keepForever, overrideSeconds, setOverrideSeconds, durationChosen, applyPromo, signedIn } = usePromoOverride();
  const { user } = useAuth();
  const [notifications, setNotifications] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(NOTIF_KEY) !== 'false';
  });

  React.useEffect(() => {
    localStorage.setItem(NOTIF_KEY, String(notifications));
  }, [notifications]);

  const submitPromo = async () => {
    const res = await applyPromo(promo);
    if (res.ok) {
      toast({ title: 'Promo applied', description: 'Pick how long uploads should stay.' });
      setPromo('');
    } else {
      toast({ title: res.reason || 'Invalid promo code', variant: 'destructive' });
    }
  };

  const [showAdmin, setShowAdmin] = React.useState(false);
  React.useEffect(() => {
    let cancelled = false;
    if (!user) { setShowAdmin(false); return; }
    checkIsAdmin().then((ok) => { if (!cancelled) setShowAdmin(ok); });
    return () => { cancelled = true; };
  }, [user]);

  const currentValue = !durationChosen
    ? ''
    : overrideSeconds === null
      ? 'forever'
      : String(overrideSeconds);

  const onDurationChange = (val: string) => {
    setOverrideSeconds(val === 'forever' ? null : Number(val));
    toast({ title: 'Upload duration updated' });
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Settings">
          <Settings className="w-4 h-4" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>Manage uploads and notifications.</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Auto-remove after 30h</Label>
            <div className="flex items-center gap-2 p-3 rounded-md border border-border/50 bg-secondary/30">
              <Checkbox checked={!keepForever || !durationChosen} disabled />
              <span className="text-sm text-muted-foreground">
                {keepForever && durationChosen
                  ? 'Promo active — using your chosen duration below.'
                  : keepForever
                    ? 'Promo applied — choose how long uploads should stay below.'
                    : 'Enabled — your uploads expire in 30h.'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Auto-removal cannot be turned off manually. Apply a valid promo code below to unlock custom durations.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="promo" className="text-sm font-medium">Promo code</Label>
            <p className="text-xs text-muted-foreground">
              {signedIn
                ? 'Apply a code to choose how long your uploads stay.'
                : 'Sign in with Google to apply a promo code.'}
            </p>
            <div className="flex gap-2">
              <Input
                id="promo"
                value={promo}
                onChange={(e) => setPromo(e.target.value)}
                placeholder="Enter code"
                disabled={!signedIn}
              />
              <Button onClick={submitPromo} size="icon" aria-label="Apply" disabled={!signedIn}>
                <Check className="w-4 h-4" />
              </Button>
            </div>
            {keepForever && <p className="text-xs text-primary">✓ Promo active</p>}
          </div>

          {keepForever && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Keep uploads for</Label>
              <Select value={currentValue} onValueChange={onDurationChange}>
                <SelectTrigger className={!durationChosen ? 'ring-2 ring-primary/60' : ''}>
                  <SelectValue placeholder="Choose a duration…" />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((o) => (
                    <SelectItem
                      key={o.label}
                      value={o.seconds === null ? 'forever' : String(o.seconds)}
                    >
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className={`text-xs ${durationChosen ? 'text-muted-foreground' : 'text-primary'}`}>
                {durationChosen
                  ? 'Applies to files you upload from now on.'
                  : 'Pick a duration to activate it. Until then, uploads use the default 30h expiry.'}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <div>
              <Label className="text-sm font-medium">Upload notifications</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Show a toast when files are shared.
              </p>
            </div>
            <Switch checked={notifications} onCheckedChange={setNotifications} />
          </div>

          {showAdmin && (
            <Link to="/admin" className="block">
              <Button variant="outline" className="w-full gap-2">
                <Shield className="w-4 h-4" />
                Open Admin
              </Button>
            </Link>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SettingsSheet;
