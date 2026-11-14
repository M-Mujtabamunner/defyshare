// Lemon Squeezy checkout overlay (Lemon.js). Falls back to a new tab if the
// script can't load (ad blockers, offline).

type LemonEvent = { event: string; data?: unknown };
declare global {
  interface Window {
    createLemonSqueezy?: () => void;
    LemonSqueezy?: {
      Setup: (opts: { eventHandler: (e: LemonEvent) => void }) => void;
      Url: { Open: (url: string) => void; Close: () => void };
    };
  }
}

const SCRIPT = 'https://app.lemonsqueezy.com/js/lemon.js';
let loading: Promise<boolean> | null = null;
let onSuccess: () => void = () => undefined;

const load = () =>
  (loading ??= new Promise<boolean>((resolve) => {
    if (window.LemonSqueezy) return resolve(true);
    const s = document.createElement('script');
    s.src = SCRIPT;
    s.defer = true;
    s.onload = () => {
      try {
        window.createLemonSqueezy?.();
        window.LemonSqueezy?.Setup({
          eventHandler: (e) => {
            if (e.event === 'Checkout.Success') onSuccess();
          },
        });
        resolve(Boolean(window.LemonSqueezy));
      } catch {
        resolve(false);
      }
    };
    s.onerror = () => {
      loading = null;
      resolve(false);
    };
    document.head.appendChild(s);
  }));

/** Start loading Lemon.js early so the overlay opens instantly. */
export const preloadCheckout = () => {
  load();
};

export const openCheckout = async (
  baseUrl: string,
  opts: { email?: string | null; name?: string | null; userId?: string | null; onPaid: () => void },
) => {
  onSuccess = opts.onPaid;
  const url = new URL(baseUrl);
  if (opts.email) url.searchParams.set('checkout[email]', opts.email);
  if (opts.name) url.searchParams.set('checkout[name]', opts.name);
  if (opts.userId) url.searchParams.set('checkout[custom][user_id]', opts.userId);
  url.searchParams.set('embed', '1');
  url.searchParams.set('media', '0');
  url.searchParams.set('logo', '0');
  if (await load()) {
    window.LemonSqueezy!.Url.Open(url.toString());
    return;
  }
  url.searchParams.delete('embed');
  window.open(url.toString(), '_blank', 'noopener');
};
