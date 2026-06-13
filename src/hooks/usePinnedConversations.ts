import { useCallback, useEffect, useState } from 'react';

const KEY = 'defyshare.pinnedConversations.v1';

const read = (): Set<string> => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
};

const write = (s: Set<string>) => {
  try {
    localStorage.setItem(KEY, JSON.stringify([...s]));
    window.dispatchEvent(new Event('pinned-conversations-changed'));
  } catch {
    /* ignore */
  }
};

export const usePinnedConversations = () => {
  const [pinned, setPinned] = useState<Set<string>>(() => read());

  useEffect(() => {
    const onChange = () => setPinned(read());
    window.addEventListener('pinned-conversations-changed', onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener('pinned-conversations-changed', onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  const isPinned = useCallback((id: string) => pinned.has(id), [pinned]);

  const togglePin = useCallback((id: string) => {
    const next = read();
    if (next.has(id)) next.delete(id);
    else next.add(id);
    write(next);
    setPinned(new Set(next));
  }, []);

  return { pinned, isPinned, togglePin };
};
