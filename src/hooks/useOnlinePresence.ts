import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface Member {
  id: string;
  name: string;
  online: boolean;
  lastSeen: number;
}

interface Me {
  id: string;
  name: string;
}

type History = Record<string, { name: string; lastSeen: number }>;

const HISTORY_DAYS = 30;
const MAX_HISTORY = 50;
const historyKey = (room: string) => `defyshare:members:${room}`;

const readHistory = (room: string): History => {
  try {
    return JSON.parse(localStorage.getItem(historyKey(room)) || '{}') as History;
  } catch {
    return {};
  }
};

const writeHistory = (room: string, h: History) => {
  const cutoff = Date.now() - HISTORY_DAYS * 86_400_000;
  const kept = Object.entries(h)
    .filter(([, m]) => m.lastSeen >= cutoff)
    .sort((a, b) => b[1].lastSeen - a[1].lastSeen)
    .slice(0, MAX_HISTORY);
  try {
    localStorage.setItem(historyKey(room), JSON.stringify(Object.fromEntries(kept)));
  } catch {
    /* storage blocked */
  }
  return Object.fromEntries(kept);
};

/**
 * Devices in this room. Presence is keyed by device id, so every tab on a
 * computer counts as one member; devices seen before are remembered on this
 * computer and listed as offline.
 */
export const useRoomMembers = (roomKey: string, me: Me) => {
  const [online, setOnline] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<History>({});
  const channelRef = useRef<RealtimeChannel | null>(null);
  const meRef = useRef(me);
  meRef.current = me;

  useEffect(() => {
    if (!roomKey) return;
    setHistory(readHistory(roomKey));
    setOnline({});

    const channel = supabase.channel(`presence-${roomKey}`, { config: { presence: { key: me.id } } });
    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<{ name?: string }>();
        const next: Record<string, string> = {};
        for (const [id, metas] of Object.entries(state)) {
          next[id] = metas[metas.length - 1]?.name || 'Unnamed device';
        }
        setOnline(next);
        setHistory((prev) => {
          const now = Date.now();
          const merged: History = { ...prev };
          for (const [id, name] of Object.entries(next)) {
            if (id !== meRef.current.id) merged[id] = { name, lastSeen: now };
          }
          return writeHistory(roomKey, merged);
        });
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') channel.track({ name: meRef.current.name });
      });

    return () => {
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [roomKey, me.id]);

  // Re-announce after a rename so other devices see the new name right away.
  useEffect(() => {
    channelRef.current?.track({ name: me.name });
  }, [me.name]);

  /** Remember devices we only know from shared files (e.g. they've gone offline). */
  const remember = useCallback(
    (seen: { id: string; name: string; at: number }[]) => {
      if (!roomKey || seen.length === 0) return;
      setHistory((prev) => {
        let changed = false;
        const merged: History = { ...prev };
        for (const s of seen) {
          if (s.id === meRef.current.id) continue;
          const cur = merged[s.id];
          if (!cur || cur.lastSeen < s.at) {
            merged[s.id] = { name: cur && cur.lastSeen > s.at ? cur.name : s.name, lastSeen: Math.max(cur?.lastSeen ?? 0, s.at) };
            changed = true;
          }
        }
        return changed ? writeHistory(roomKey, merged) : prev;
      });
    },
    [roomKey],
  );

  const members = useMemo<Member[]>(() => {
    const list: Member[] = [];
    for (const [id, name] of Object.entries(online)) {
      if (id !== me.id) list.push({ id, name, online: true, lastSeen: Date.now() });
    }
    for (const [id, m] of Object.entries(history)) {
      if (id !== me.id && !(id in online)) list.push({ id, name: m.name, online: false, lastSeen: m.lastSeen });
    }
    return list.sort((a, b) =>
      a.online !== b.online ? (a.online ? -1 : 1) : a.online ? a.name.localeCompare(b.name) : b.lastSeen - a.lastSeen,
    );
  }, [online, history, me.id]);

  // Count this device even before presence connects.
  const onlineCount = Math.max(1, Object.keys(online).length + (me.id in online ? 0 : 1));

  const otherNames = useMemo(() => members.filter((m) => m.online).map((m) => m.name), [members]);

  return { members, onlineCount, otherNames, remember };
};
