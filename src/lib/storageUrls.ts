import { supabase } from '@/integrations/supabase/client';

const cache = new Map<string, { url: string; expiresAt: number }>();
const SIGNED_TTL_SECONDS = 60 * 60; // 1 hour
const REFRESH_BUFFER_MS = 60_000;

export const getSignedFileUrl = async (filePath: string): Promise<string | null> => {
  const cached = cache.get(filePath);
  if (cached && cached.expiresAt - Date.now() > REFRESH_BUFFER_MS) {
    return cached.url;
  }
  const { data, error } = await supabase.storage
    .from('shared-files')
    .createSignedUrl(filePath, SIGNED_TTL_SECONDS);
  if (error || !data) return null;
  cache.set(filePath, {
    url: data.signedUrl,
    expiresAt: Date.now() + SIGNED_TTL_SECONDS * 1000,
  });
  return data.signedUrl;
};

/**
 * Force a real browser download from a (possibly cross-origin) URL.
 * Fetches as a blob so the `download` attribute is honored instead of
 * the browser navigating to / opening the file.
 */
export const triggerBlobDownload = async (url: string, filename: string) => {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename || 'download';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  } catch {
    // Fallback: open the URL if blob fetch fails
    window.open(url, '_blank', 'noopener');
  }
};
