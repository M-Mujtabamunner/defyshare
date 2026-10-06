import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Small shared key/value records for a room (groups, memberships, invites).
// There is no table for these and the hosted schema can't be changed from here,
// so they live in `shared_texts` under a separate room key ("meta:<room>") that
// the Text tab never reads. That table allows insert/select/delete only, so an
// edit is a delete + insert; each record carries its own stable `id`.

const RECORD_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const REFRESH_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

export interface RecordRow<T> {
  rowId: string;
  createdAt: number;
  data: T;
}

export type RecordEvent<T> = { type: 'insert' | 'delete'; record: RecordRow<T> };

const metaKey = (room: string) => `meta:${room}`;

const parse = <T,>(row: { id: string; content: string; created_at: string }): RecordRow<T> | null => {
  try {
    return { rowId: row.id, createdAt: new Date(row.created_at).getTime(), data: JSON.parse(row.content) as T };
  } catch {
    return null;
  }
};

export const useRoomRecords = <T extends { id: string }>(roomKey: string, onEvent?: (e: RecordEvent<T>) => void) => {
  const [rows, setRows] = useState<RecordRow<T>[]>([]);
  const [loaded, setLoaded] = useState(false);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!roomKey) return;
    let active = true;
    setRows([]);
    setLoaded(false);

    supabase
      .from('shared_texts')
      .select('id, content, created_at')
      .eq('room_key', metaKey(roomKey))
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: true })
      .limit(1000)
      .then(({ data }) => {
        if (!active) return;
        setRows((data ?? []).map((r) => parse<T>(r)).filter((r): r is RecordRow<T> => !!r));
        setLoaded(true);
      });

    const channel = supabase
      .channel(`meta-${roomKey}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shared_texts', filter: `room_key=eq.${metaKey(roomKey)}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const rec = parse<T>(payload.new as { id: string; content: string; created_at: string });
            if (!rec) return;
            setRows((prev) => (prev.some((r) => r.rowId === rec.rowId) ? prev : [...prev, rec]));
            onEventRef.current?.({ type: 'insert', record: rec });
          } else if (payload.eventType === 'DELETE') {
            const old = payload.old as { id: string; content?: string; created_at?: string };
            setRows((prev) => prev.filter((r) => r.rowId !== old.id));
            const rec = old.content ? parse<T>(old as { id: string; content: string; created_at: string }) : null;
            if (rec) onEventRef.current?.({ type: 'delete', record: rec });
          }
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [roomKey]);

  const insert = useCallback(
    async (data: T) => {
      const { data: row, error } = await supabase
        .from('shared_texts')
        .insert({
          room_key: metaKey(roomKey),
          content: JSON.stringify(data),
          expires_at: new Date(Date.now() + RECORD_TTL_MS).toISOString(),
        })
        .select('id, content, created_at')
        .single();
      if (error) throw error;
      const rec = parse<T>(row);
      if (rec) setRows((prev) => (prev.some((r) => r.rowId === rec.rowId) ? prev : [...prev, rec]));
      return rec;
    },
    [roomKey],
  );

  const removeRows = useCallback(async (rowIds: string[]) => {
    if (rowIds.length === 0) return;
    const ids = new Set(rowIds);
    setRows((prev) => prev.filter((r) => !ids.has(r.rowId)));
    await supabase.from('shared_texts').delete().in('id', rowIds);
  }, []);

  /** Replace a record (same logical id) — also used to push its expiry forward. */
  const replace = useCallback(
    async (rowId: string, data: T) => {
      const rec = await insert(data);
      await removeRows([rowId]);
      return rec;
    },
    [insert, removeRows],
  );

  // Latest row wins when the same logical record exists twice (mid-edit).
  const latest = rows.reduce<Map<string, RecordRow<T>>>((map, r) => {
    const cur = map.get(r.data.id);
    if (!cur || cur.createdAt <= r.createdAt) map.set(r.data.id, r);
    return map;
  }, new Map());

  return { records: [...latest.values()], allRows: rows, loaded, insert, removeRows, replace, REFRESH_AFTER_MS };
};
