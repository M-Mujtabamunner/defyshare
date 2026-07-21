// Guarded service worker registration.
// Only registers in production on the real published domain.
// Never registers in Lovable preview / dev / iframe.

const SW_PATH = '/sw.js';

function shouldSkip(): boolean {
  if (typeof window === 'undefined') return true;
  if (!('serviceWorker' in navigator)) return true;
  if (!import.meta.env.PROD) return true;
  if (window.top !== window.self) return true;

  const host = window.location.hostname;
  if (
    host.startsWith('id-preview--') ||
    host.startsWith('preview--') ||
    host === 'lovableproject.com' ||
    host.endsWith('.lovableproject.com') ||
    host === 'lovableproject-dev.com' ||
    host.endsWith('.lovableproject-dev.com') ||
    host === 'beta.lovable.dev' ||
    host.endsWith('.beta.lovable.dev')
  ) return true;

  if (new URLSearchParams(window.location.search).get('sw') === 'off') return true;
  return false;
}

async function unregisterExisting() {
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    for (const r of regs) {
      if (r.active?.scriptURL.endsWith(SW_PATH)) await r.unregister();
    }
  } catch {}
}

export function registerServiceWorker() {
  if (typeof window === 'undefined') return;
  if (shouldSkip()) {
    if ('serviceWorker' in navigator) void unregisterExisting();
    return;
  }
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(SW_PATH).catch(() => {});
  });
}
