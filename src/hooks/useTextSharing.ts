import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FILE_TTL_MS } from '@/hooks/useFileSharing';

export interface SharedText {
  id: string;
  content: string;
  created_at: string;
  expires_at?: string;
}

export const MAX_TEXT_LENGTH = 10000;

const sanitize = (content: string) =>
  // Strip null and other risky control chars but keep \n and \t
  // eslint-disable-next-line no-control-regex -- stripping control chars is the point
  content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

const cacheKey = (room: string) => `defyshare:texts:${room}`;
const isLive = (t: SharedText) => !t.expires_at || new Date(t.expires_at).getTime() > Date.now();

const readCache = (room: string): SharedText[] => {
  try {
    const raw = localStorage.getItem(cacheKey(room));
    return raw ? (JSON.parse(raw) as SharedText[]).filter(isLive) : [];
  } catch {
    return [];
  }
};

export const useTextSharing = (roomKey: string) => {
  const [texts, setTexts] = useState<SharedText[]>(() => (roomKey ? readCache(roomKey) : []));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomKey) return;
    let active = true;

    const cached = readCache(roomKey);
    setTexts(cached);
    setLoading(cached.length === 0);

    supabase
      .from('shared_texts')
      .select('id, content, created_at, expires_at')
      .eq('room_key', roomKey)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(200)
      .then(({ data, error }) => {
        if (!active) return;
        if (!error && data) setTexts(data);
        setLoading(false);
      });

    const channel = supabase
      .channel(`texts-${roomKey}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shared_texts',
          filter: `room_key=eq.${roomKey}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const row = payload.new as SharedText;
            setTexts((prev) => (prev.some((t) => t.id === row.id) ? prev : [row, ...prev]));
          } else if (payload.eventType === 'DELETE') {
            setTexts((prev) => prev.filter((t) => t.id !== payload.old.id));
          }
        },
      )
      .subscribe();

    const tick = setInterval(() => {
      setTexts((prev) => (prev.every(isLive) ? prev : prev.filter(isLive)));
    }, 30_000);

    return () => {
      active = false;
      clearInterval(tick);
      supabase.removeChannel(channel);
    };
  }, [roomKey]);

  useEffect(() => {
    if (!roomKey || loading) return;
    try {
      localStorage.setItem(cacheKey(roomKey), JSON.stringify(texts.slice(0, 50)));
    } catch {
      /* storage full or blocked */
    }
  }, [roomKey, texts, loading]);

  const addText = useCallback(
    async (content: string) => {
      if (!roomKey) return;
      const trimmed = sanitize(content.trim());
      if (!trimmed) return;
      if (trimmed.length > MAX_TEXT_LENGTH) {
        throw new Error(`Text too long. Maximum ${MAX_TEXT_LENGTH} characters allowed.`);
      }
      const { data, error } = await supabase
        .from('shared_texts')
        .insert({
          room_key: roomKey,
          content: trimmed,
          expires_at: new Date(Date.now() + FILE_TTL_MS).toISOString(),
        })
        .select('id, content, created_at, expires_at')
        .single();
      if (error) throw new Error('Could not share text');
      setTexts((prev) => (prev.some((t) => t.id === data.id) ? prev : [data, ...prev]));
    },
    [roomKey],
  );

  const removeText = useCallback(async (textId: string) => {
    setTexts((prev) => prev.filter((t) => t.id !== textId));
    await supabase.from('shared_texts').delete().eq('id', textId);
  }, []);

  const clearAllTexts = useCallback(async () => {
    setTexts([]);
    await supabase.from('shared_texts').delete().eq('room_key', roomKey);
  }, [roomKey]);

  return { texts, loading, addText, removeText, clearAllTexts };
};
