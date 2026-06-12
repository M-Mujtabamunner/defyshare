import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useOnlinePresence = (roomKey: string) => {
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    if (!roomKey) return;

    const channel = supabase.channel(`presence-${roomKey}`, {
      config: { presence: { key: crypto.randomUUID() } }
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const count = Object.keys(state).length;
        setOnlineCount(count);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomKey]);

  return onlineCount;
};
