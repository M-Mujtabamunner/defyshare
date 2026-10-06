import React from 'react';
import { Settings, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import HeaderButton from '@/components/HeaderButton';
import InstallButton from '@/components/InstallButton';
import { useAuth } from '@/hooks/useAuth';
import { setSoundEnabled, soundEnabled } from '@/hooks/useNotifications';
import { checkIsAdmin } from '@/lib/admin';
import { LANGUAGES, useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const NOTIF_KEY = 'defyshare:notifications';

const readFlag = (key: string) => {
  try {
    return localStorage.getItem(key) !== 'false';
  } catch {
    return true;
  }
};

const SettingsSheet: React.FC = () => {
  const { t, lang, setLang } = useT();
  const { user } = useAuth();
  const [confirmations, setConfirmations] = React.useState(() => readFlag(NOTIF_KEY));
  const [sound, setSound] = React.useState(soundEnabled);

  const toggleConfirmations = (on: boolean) => {
    setConfirmations(on);
    try {
      localStorage.setItem(NOTIF_KEY, String(on));
    } catch {
      /* ignore */
    }
  };

  const toggleSound = (on: boolean) => {
    setSound(on);
    setSoundEnabled(on);
  };

  const [showAdmin, setShowAdmin] = React.useState(false);
  React.useEffect(() => {
    let cancelled = false;
    if (!user) {
      setShowAdmin(false);
      return;
    }
    checkIsAdmin().then((ok) => {
      if (!cancelled) setShowAdmin(ok);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <HeaderButton label={t('settings')}>
          <Settings className="w-[18px] h-[18px]" />
        </HeaderButton>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t('settings')}</SheetTitle>
          <SheetDescription>{t('settingsDesc')}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <InstallButton full />

          <section className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground">{t('language')}</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLang(l.code)}
                  className={cn(
                    'h-10 rounded-lg border text-sm font-medium transition-colors',
                    l.code === lang ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40',
                  )}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </section>

          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="sound" className="text-sm font-medium">
              {t('notificationSound')}
            </Label>
            <Switch id="sound" checked={sound} onCheckedChange={toggleSound} />
          </div>

          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="notif" className="text-sm font-medium">
              {t('uploadNotifications')}
            </Label>
            <Switch id="notif" checked={confirmations} onCheckedChange={toggleConfirmations} />
          </div>

          {showAdmin && (
            <Link to="/admin" className="block">
              <Button variant="outline" className="w-full gap-2">
                <Shield className="w-4 h-4" />
                {t('openAdmin')}
              </Button>
            </Link>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SettingsSheet;
