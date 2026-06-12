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
