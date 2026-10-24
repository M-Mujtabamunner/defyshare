import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FILE_TTL_MS } from '@/hooks/useFileSharing';
import { decodeTarget, encodeTarget, EVERYONE, targetIncludes, type Peer, type Target } from '@/lib/recipients';

export interface SharedText {
  id: string;
  /** The text itself (without the sender/audience header). */
  content: string;
  created_at: string;
  expires_at?: string;
  from: Peer | null;
  target: Target;
}

export const MAX_TEXT_LENGTH = 10000;

const sanitize = (content: string) =>
  // Strip null and other risky control chars but keep \n and \t
  // eslint-disable-next-line no-control-regex -- stripping control chars is the point
  content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

// shared_texts has no sender/audience columns, so new texts are stored as
// HEADER + JSON {from, to, text}. HEADER starts with an invisible separator
// (U+2063) so it can't collide with anything a person types. Rows without it
// are older texts: shown to everyone, sender unknown.
const HEADER = '⁣dfs1:';

interface Envelope {
  from: Peer;
  to: string | null; // encodeTarget()
  text: string;
}

type Row = { id: string; content: string; created_at: string; expires_at?: string };

const parse = (row: Row): SharedText => {
  if (row.content.startsWith(HEADER)) {
    try {
      const env = JSON.parse(row.content.slice(HEADER.length)) as Envelope;
      return { ...row, content: env.text, from: env.from ?? null, target: decodeTarget(env.to) };
    } catch {
      /* fall through to plain text */
    }
  }
  return { ...row, from: null, target: EVERYONE };
};

const cacheKey = (room: string) => `defyshare:texts:${room}`;
const isLive = (t: { expires_at?: string }) => !t.expires_at || new Date(t.expires_at).getTime() > Date.now();

const readCache = (room: string): Row[] => {
  try {
    const raw = localStorage.getItem(cacheKey(room));
    return raw ? (JSON.parse(raw) as Row[]).filter(isLive) : [];
  } catch {
    return [];
  }
};

const NO_GROUPS: ReadonlySet<string> = new Set();

export const useTextSharing = (
  roomKey: string,
  deviceId: string,
  myGroupIds: ReadonlySet<string> = NO_GROUPS,
  onIncoming?: (text: SharedText) => void,
) => {
  const [rows, setRows] = useState<Row[]>(() => (roomKey ? readCache(roomKey) : []));
  const [loading, setLoading] = useState(true);
  const onIncomingRef = useRef(onIncoming);
  onIncomingRef.current = onIncoming;
  const deviceIdRef = useRef(deviceId);
  deviceIdRef.current = deviceId;
  const groupIdsRef = useRef(myGroupIds);
  groupIdsRef.current = myGroupIds;

  useEffect(() => {
    if (!roomKey) return;
    let active = true;

    const cached = readCache(roomKey);
    setRows(cached);
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
        if (!error && data) setRows(data);
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
            const row = payload.new as Row;
            setRows((prev) => (prev.some((t) => t.id === row.id) ? prev : [row, ...prev]));
            const text = parse(row);
            const me = deviceIdRef.current;
            if (text.target.kind !== 'everyone' && text.from?.id !== me && targetIncludes(text.target, me, groupIdsRef.current)) {
              onIncomingRef.current?.(text);
            }
          } else if (payload.eventType === 'DELETE') {
            setRows((prev) => prev.filter((t) => t.id !== payload.old.id));
          }
        },
      )
      .subscribe();

    const tick = setInterval(() => {
      setRows((prev) => (prev.every(isLive) ? prev : prev.filter(isLive)));
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
      localStorage.setItem(cacheKey(roomKey), JSON.stringify(rows.slice(0, 50)));
    } catch {
      /* storage full or blocked */
    }
  }, [roomKey, rows, loading]);

  /** Texts sent to specific devices or a group only show to them and the sender. */
  const texts = useMemo(
    () =>
      rows
        .map(parse)
        .filter((t) => t.from?.id === deviceId || targetIncludes(t.target, deviceId, myGroupIds)),
    [rows, deviceId, myGroupIds],
  );

  const addText = useCallback(
    async (content: string, from: Peer, target: Target = EVERYONE) => {
      if (!roomKey) return;
      const trimmed = sanitize(content.trim());
      if (!trimmed) return;
      if (trimmed.length > MAX_TEXT_LENGTH) {
        throw new Error(`Text too long. Maximum ${MAX_TEXT_LENGTH} characters allowed.`);
      }
      const envelope: Envelope = { from, to: encodeTarget(target), text: trimmed };
      const { data, error } = await supabase
        .from('shared_texts')
        .insert({
          room_key: roomKey,
          content: HEADER + JSON.stringify(envelope),
          expires_at: new Date(Date.now() + FILE_TTL_MS).toISOString(),
        })
        .select('id, content, created_at, expires_at')
        .single();
      if (error) throw new Error('Could not share text');
      setRows((prev) => (prev.some((t) => t.id === data.id) ? prev : [data, ...prev]));
    },
    [roomKey],
  );

  const removeText = useCallback(async (textId: string) => {
    setRows((prev) => prev.filter((t) => t.id !== textId));
    await supabase.from('shared_texts').delete().eq('id', textId);
  }, []);

  /** Clears what this device can see — never texts sent privately to other devices. */
  const clearAllTexts = useCallback(async () => {
    const ids = texts.map((t) => t.id);
    const idSet = new Set(ids);
    setRows((prev) => prev.filter((t) => !idSet.has(t.id)));
    if (ids.length > 0) await supabase.from('shared_texts').delete().in('id', ids);
  }, [texts]);

  return { texts, loading, addText, removeText, clearAllTexts };
};
