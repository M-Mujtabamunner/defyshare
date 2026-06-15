import type { MessageRow } from '@/hooks/useMessages';

const cache = new Map<string, { rows: MessageRow[]; ts: number }>();
const TTL_MS = 60_000;

export const primeMessages = (conversationId: string, rows: MessageRow[]) => {
  cache.set(conversationId, { rows, ts: Date.now() });
};

export const getCachedMessages = (conversationId: string): MessageRow[] | null => {
  const hit = cache.get(conversationId);
  if (!hit) return null;
  if (Date.now() - hit.ts > TTL_MS) return null;
  return hit.rows;
};

export const clearMessagesCache = () => cache.clear();
