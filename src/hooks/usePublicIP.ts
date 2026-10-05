import { useEffect, useState } from 'react';

interface PublicIPState {
  publicIP: string;
  roomId: string;
  loading: boolean;
  /** True once the room comes from a fresh IP lookup (not the cached one). */
  verified: boolean;
}

const ROOM_CACHE_KEY = 'defyshare:lastRoom';
const ENDPOINTS = ['https://api.ipify.org?format=json', 'https://api64.ipify.org?format=json'];
const FALLBACK_ENDPOINT = 'https://ipapi.co/json/';

const ipToRoom = (ip: string) => ip.replace(/[.:]/g, '-');

const readCachedIP = () => {
  try {
    return localStorage.getItem(ROOM_CACHE_KEY);
  } catch {
    return null;
  }
};

const lookupIP = async (url: string) => {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(String(res.status));
  const ip: string | undefined = (await res.json()).ip;
  if (!ip) throw new Error('no ip');
  return ip;
};

export const usePublicIP = (): PublicIPState => {
  // Start from the last known network so the room's files show instantly;
  // uploads wait for `verified` so nothing lands in the wrong room.
  const [state, setState] = useState<PublicIPState>(() => {
    const cached = readCachedIP();
    return cached
      ? { publicIP: cached, roomId: ipToRoom(cached), loading: true, verified: false }
      : { publicIP: 'detecting...', roomId: '', loading: true, verified: false };
  });

  useEffect(() => {
    let cancelled = false;
    Promise.any(ENDPOINTS.map(lookupIP))
      .catch(() => lookupIP(FALLBACK_ENDPOINT))
      .then((ip) => {
        if (cancelled) return;
        try {
          localStorage.setItem(ROOM_CACHE_KEY, ip);
        } catch {
          /* ignore */
        }
        setState({ publicIP: ip, roomId: ipToRoom(ip), loading: false, verified: true });
      })
      .catch(() => {
        if (!cancelled) setState({ publicIP: 'offline', roomId: 'offline-room', loading: false, verified: true });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
};
