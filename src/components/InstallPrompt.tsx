import { useEffect, useState } from 'react';
import { Download, Share, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const DISMISS_KEY = 'defyshare:install-dismissed';

function isStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari
    (window.navigator as any).standalone === true
  );
}

function isIOS() {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
}

export const InstallPrompt = () => {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [showIOS, setShowIOS] = useState(false);
  const [dismissed, setDismissed] = useState(
    typeof window !== 'undefined' && localStorage.getItem(DISMISS_KEY) === '1'
  );

  useEffect(() => {
    if (isStandalone()) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);

    const onInstalled = () => {
      setDeferred(null);
      setShowIOS(false);
    };
    window.addEventListener('appinstalled', onInstalled);

    // iOS has no beforeinstallprompt — offer instructions after brief delay
    if (isIOS() && !dismissed) {
      const t = setTimeout(() => setShowIOS(true), 2500);
      return () => {
        clearTimeout(t);
        window.removeEventListener('beforeinstallprompt', onPrompt);
        window.removeEventListener('appinstalled', onInstalled);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, [dismissed]);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
    setDeferred(null);
    setShowIOS(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  if (dismissed || isStandalone()) return null;

  if (deferred) {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-2xl border border-border/60 bg-card/95 backdrop-blur shadow-xl p-4 animate-fade-in">
        <div className="flex items-start gap-3">
          <img src="/icons/icon-96.png" alt="" className="w-10 h-10 rounded-lg" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Install DefyShare</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Add to your home screen for a native app experience.
            </p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={install} className="gap-1.5">
                <Download className="w-3.5 h-3.5" /> Install
              </Button>
              <Button size="sm" variant="ghost" onClick={dismiss}>Not now</Button>
            </div>
          </div>
          <button aria-label="Dismiss" onClick={dismiss} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (showIOS) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-border/60 bg-card/95 backdrop-blur shadow-xl p-4">
        <div className="flex items-start gap-3">
          <img src="/icons/icon-96.png" alt="" className="w-10 h-10 rounded-lg shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Install DefyShare</p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center flex-wrap gap-1">
              Tap <Share className="w-3.5 h-3.5 inline" /> then
              <span className="inline-flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Add to Home Screen
              </span>
            </p>
          </div>
          <button aria-label="Dismiss" onClick={dismiss} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return null;
};
