import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SharedText {
  id: string;
  content: string;
  created_at: string;
}

export const MAX_TEXT_LENGTH = 10000;

const sanitize = (content: string) =>
  // Strip null and other risky control chars but keep \n and \t
  content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

export const useTextSharing = (roomKey: string) => {
  const [texts, setTexts] = useState<SharedText[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomKey) return;

    const fetchTexts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('shared_texts')
        .select('*')
        .eq('room_key', roomKey)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setTexts(data);
      }
      setLoading(false);
    };

    fetchTexts();

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
            setTexts((prev) => [payload.new as SharedText, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setTexts((prev) => prev.filter((t) => t.id !== payload.old.id));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomKey]);

  const addText = useCallback(
    async (content: string) => {
      if (!roomKey) return;
      const trimmed = sanitize(content.trim());
      if (!trimmed) return;
      if (trimmed.length > MAX_TEXT_LENGTH) {
        throw new Error(`Text too long. Maximum ${MAX_TEXT_LENGTH} characters allowed.`);
      }
      const { error } = await supabase.from('shared_texts').insert({
        room_key: roomKey,
        content: trimmed,
      });
      if (error) throw new Error('Could not share text');
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
