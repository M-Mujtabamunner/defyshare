import { useCallback, useEffect, useState } from 'react';
import { playChime } from '@/lib/sound';

export type NotificationKind = 'file' | 'invite' | 'joined' | 'removed';

export interface AppNotification {
  /** Stable id from the event, so several tabs don't record it twice. */
  id: string;
  kind: NotificationKind;
  title: string;
  at: number;
  read: boolean;
}

const KEY = 'defyshare:notifications-list';
const SOUND_KEY = 'defyshare:sound';
const MAX = 50;
const CHANGE_EVENT = 'defyshare:notifications-changed';

const read = (): AppNotification[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]') as AppNotification[];
  } catch {
    return [];
  }
};

const write = (list: AppNotification[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {
    /* storage blocked */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
};

export const soundEnabled = () => {
  try {
    return localStorage.getItem(SOUND_KEY) !== 'false';
  } catch {
    return true;
  }
};

export const setSoundEnabled = (on: boolean) => {
  try {
    localStorage.setItem(SOUND_KEY, String(on));
  } catch {
    /* ignore */
  }
};

/** Notifications saved on this device and shared by all its tabs. */
export const useNotifications = () => {
  const [items, setItems] = useState<AppNotification[]>(read);
  const [fresh, setFresh] = useState<AppNotification[]>([]); // shown as slide-in cards

  useEffect(() => {
    const refresh = () => setItems(read());
    const onStorage = (e: StorageEvent) => e.key === KEY && refresh();
    window.addEventListener(CHANGE_EVENT, refresh);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(CHANGE_EVENT, refresh);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const push = useCallback((n: Omit<AppNotification, 'at' | 'read'>) => {
    const list = read();
    if (list.some((x) => x.id === n.id)) return; // another tab already recorded it
    const item: AppNotification = { ...n, at: Date.now(), read: false };
    write([item, ...list]);
    // Only the tab you're looking at chimes and shows the card.
    if (document.visibilityState === 'visible') {
      if (soundEnabled()) playChime();
      setFresh((prev) => [item, ...prev].slice(0, 3));
    }
  }, []);

  const dismissFresh = useCallback((id: string) => setFresh((prev) => prev.filter((n) => n.id !== id)), []);
  const markAllRead = useCallback(() => {
    const list = read();
    if (list.some((n) => !n.read)) write(list.map((n) => ({ ...n, read: true })));
  }, []);
  const clear = useCallback(() => write([]), []);

  return { items, unread: items.filter((n) => !n.read).length, fresh, push, dismissFresh, markAllRead, clear };
};
