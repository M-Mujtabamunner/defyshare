import { supabase } from '@/integrations/supabase/client';

const B2_PREFIX = 'b2://';
const SIGNED_TTL_SECONDS = 60 * 60; // 1 hour
const REFRESH_BUFFER_MS = 60_000;

const fileCache = new Map<string, { url: string; expiresAt: number }>();
const chatCache = new Map<string, { url: string; expiresAt: number }>();

export const isB2Path = (p: string) => p.startsWith(B2_PREFIX);
export const toB2Path = (key: string) => B2_PREFIX + key;
export const b2Key = (p: string) => p.slice(B2_PREFIX.length);

async function b2SignedUrl(action: 'put' | 'get', key: string, contentType?: string) {
  const { data, error } = await supabase.functions.invoke('b2-sign', {
    body: { action, key, contentType, expires: SIGNED_TTL_SECONDS },
  });
  if (error || !data?.url) throw new Error(error?.message || 'Failed to sign B2 URL');
  return data.url as string;
}

export const getB2UploadUrl = (key: string, contentType?: string) =>
  b2SignedUrl('put', key, contentType);

async function getSigned(
  filePath: string,
  bucket: 'shared-files' | 'chat-media',
  cache: Map<string, { url: string; expiresAt: number }>,
): Promise<string | null> {
  const cached = cache.get(filePath);
  if (cached && cached.expiresAt - Date.now() > REFRESH_BUFFER_MS) {
    return cached.url;
  }

  let url: string | null = null;

  if (isB2Path(filePath)) {
    try {
      url = await b2SignedUrl('get', b2Key(filePath));
    } catch {
      url = null;
    }
  } else {
    const { data } = await supabase.storage.from(bucket).createSignedUrl(filePath, SIGNED_TTL_SECONDS);
    url = data?.signedUrl ?? null;
  }

  if (url) {
    cache.set(filePath, { url, expiresAt: Date.now() + SIGNED_TTL_SECONDS * 1000 });
  }
  return url;
}

export const getSignedFileUrl = (filePath: string) =>
  getSigned(filePath, 'shared-files', fileCache);

export const getSignedChatUrl = (filePath: string) =>
  getSigned(filePath, 'chat-media', chatCache);

/**
 * Force a real browser download from a (possibly cross-origin) URL.
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
    window.open(url, '_blank', 'noopener');
  }
};
