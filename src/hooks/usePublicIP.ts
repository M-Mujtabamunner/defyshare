import { useEffect, useState } from 'react';

interface PublicIPState {
  publicIP: string;
  roomId: string;
  loading: boolean;
}

const ipToRoom = (ip: string) => ip.replace(/[.:]/g, '-');

export const usePublicIP = (): PublicIPState => {
  const [state, setState] = useState<PublicIPState>({
    publicIP: 'detecting...',
    roomId: '',
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    const fetchIP = async () => {
      const endpoints = [
        'https://api.ipify.org?format=json',
        'https://ipapi.co/json/',
        'https://api64.ipify.org?format=json',
      ];
      for (const url of endpoints) {
        try {
          const res = await fetch(url);
          if (!res.ok) continue;
          const data = await res.json();
          const ip: string | undefined = data.ip;
          if (ip && !cancelled) {
            setState({ publicIP: ip, roomId: ipToRoom(ip), loading: false });
            return;
          }
        } catch {
          /* try next */
        }
      }
      if (!cancelled) {
        setState({ publicIP: 'offline', roomId: 'offline-room', loading: false });
      }
    };

    fetchIP();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
};
