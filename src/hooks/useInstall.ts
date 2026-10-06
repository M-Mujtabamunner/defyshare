import { useCallback, useEffect, useState } from 'react';

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

// Chrome fires this once, early — keep it even if no component is mounted yet.
let deferred: InstallEvent | null = null;
const listeners = new Set<() => void>();
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as InstallEvent;
    listeners.forEach((l) => l());
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    listeners.forEach((l) => l());
  });
}

/** Whether the app can be installed here, and how. */
export const useInstall = () => {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  const installed = isStandalone();
  const mode: 'prompt' | 'ios' | null = installed ? null : deferred ? 'prompt' : isIOS() ? 'ios' : null;

  const install = useCallback(async () => {
    if (!deferred) return false;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    deferred = null;
    listeners.forEach((l) => l());
    return outcome === 'accepted';
  }, []);

  return { mode, install };
};
