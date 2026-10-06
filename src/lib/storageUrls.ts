import { supabase } from '@/integrations/supabase/client';

const B2_PREFIX = 'b2://';
const SIGN_ENDPOINT = '/api/b2-sign';
const SIGNED_TTL_SECONDS = 60 * 60; // 1 hour
const REFRESH_BUFFER_MS = 60_000;
const MAX_BATCH = 200;

export const isB2Path = (p: string) => p.startsWith(B2_PREFIX);
export const toB2Path = (key: string) => B2_PREFIX + key;
export const b2Key = (p: string) => p.slice(B2_PREFIX.length);

async function signRequest<T>(body: Record<string, unknown>): Promise<T> {
  const res = await fetch(SIGN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || `Signing failed (${res.status})`);
  return json as T;
}

/** Upload URLs for many small files in as few requests as possible. */
export const getB2UploadUrls = async (keys: string[]) => {
  const urls: Record<string, string> = {};
  for (let i = 0; i < keys.length; i += MAX_BATCH) {
    const res = await signRequest<{ urls: Record<string, string> }>({ action: 'put', keys: keys.slice(i, i + MAX_BATCH) });
    Object.assign(urls, res.urls);
  }
  return urls;
};

// --- Multipart: large files upload as parallel parts ---
export const startMultipart = async (key: string, contentType: string) =>
  (await signRequest<{ uploadId: string }>({ action: 'mp-create', key, contentType })).uploadId;

export const getPartUrls = async (key: string, uploadId: string, parts: number[]) =>
  (await signRequest<{ urls: Record<string, string> }>({ action: 'mp-parts', key, uploadId, parts })).urls;

export const completeMultipart = (key: string, uploadId: string, parts: { partNumber: number; etag: string }[]) =>
  signRequest({ action: 'mp-complete', key, uploadId, parts });

export const abortMultipart = (key: string, uploadId: string) =>
  signRequest({ action: 'mp-abort', key, uploadId }).catch(() => undefined);

export const deleteB2Objects = async (keys: string[]) => {
  if (keys.length === 0) return;
  await signRequest({ action: 'delete', keys }).catch(() => undefined);
};

// --- Batched GET signing: every thumbnail/preview asked for in the same tick
// goes out as a single request.
const cache = new Map<string, { url: string; expiresAt: number }>();
const inflight = new Map<string, Promise<string | null>>();
let queue: { key: string; resolve: (url: string | null) => void }[] = [];
let flushScheduled = false;

const flush = async () => {
  const batch = queue;
  queue = [];
  flushScheduled = false;
  const keys = [...new Set(batch.map((p) => p.key))];
  const urls: Record<string, string> = {};
  for (let i = 0; i < keys.length; i += MAX_BATCH) {
    try {
      const res = await signRequest<{ urls: Record<string, string> }>({
        action: 'get',
        keys: keys.slice(i, i + MAX_BATCH),
        expires: SIGNED_TTL_SECONDS,
      });
      Object.assign(urls, res.urls);
    } catch {
      /* leave missing; callers get null */
    }
  }
  const expiresAt = Date.now() + SIGNED_TTL_SECONDS * 1000;
  for (const k of keys) if (urls[k]) cache.set(k, { url: urls[k], expiresAt });
  for (const p of batch) p.resolve(urls[p.key] ?? null);
};

const signGet = (key: string): Promise<string | null> => {
  const cached = cache.get(key);
  if (cached && cached.expiresAt - Date.now() > REFRESH_BUFFER_MS) return Promise.resolve(cached.url);
  const pending = inflight.get(key);
  if (pending) return pending;
  const promise = new Promise<string | null>((resolve) => {
    queue.push({ key, resolve });
    if (!flushScheduled) {
      flushScheduled = true;
      setTimeout(flush, 0);
    }
  }).finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
};

async function getSigned(filePath: string, bucket: 'shared-files' | 'chat-media'): Promise<string | null> {
  if (isB2Path(filePath)) return signGet(b2Key(filePath));
  // Legacy rows stored in Supabase Storage
  const { data } = await supabase.storage.from(bucket).createSignedUrl(filePath, SIGNED_TTL_SECONDS);
  return data?.signedUrl ?? null;
}

export const getSignedFileUrl = (filePath: string) => getSigned(filePath, 'shared-files');

export const getSignedChatUrl = (filePath: string) => getSigned(filePath, 'chat-media');

/** URL that makes the browser save the file under `filename` (streams; no memory copy). */
export const getDownloadUrl = async (filePath: string, filename: string): Promise<string | null> => {
  if (!isB2Path(filePath)) return getSignedFileUrl(filePath);
  try {
    const { url } = await signRequest<{ url: string }>({
      action: 'get',
      key: b2Key(filePath),
      download: filename,
      expires: SIGNED_TTL_SECONDS,
    });
    return url;
  } catch {
    return null;
  }
};

export const triggerDownload = (url: string, filename: string) => {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'download';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
};
