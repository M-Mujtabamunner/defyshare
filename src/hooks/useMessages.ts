import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_type: 'text' | 'image' | 'video' | 'file';
  text_content: string | null;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  file_type: string | null;
  created_at: string;
}

export const useMessages = (conversationId: string | null) => {
  const { user } = useAuth();
  const uid = user?.id ?? null;
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<{ name: string; progress: number } | null>(null);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (!active) return;
        setMessages((data ?? []) as MessageRow[]);
        setLoading(false);
      });

    const channel = supabase
      .channel(`msgs-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMessages((prev) =>
              prev.some((m) => m.id === (payload.new as MessageRow).id)
                ? prev
                : [...prev, payload.new as MessageRow],
            );
          } else if (payload.eventType === 'DELETE') {
            setMessages((prev) => prev.filter((m) => m.id !== (payload.old as MessageRow).id));
          }
        },
      )
      .subscribe();

    // mark read on open + when new messages arrive
    if (uid) {
      supabase
        .from('conversation_members')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', uid)
        .then(() => {});
    }

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [conversationId, uid]);

  const markRead = useCallback(async () => {
    if (!uid || !conversationId) return;
    await supabase
      .from('conversation_members')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', uid);
  }, [uid, conversationId]);

  const sendText = useCallback(
    async (text: string) => {
      if (!uid || !conversationId) return;
      const trimmed = text.trim();
      if (!trimmed) return;
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: uid,
        message_type: 'text',
        text_content: trimmed,
      });
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);
    },
    [uid, conversationId],
  );

  const sendFile = useCallback(
    async (file: File) => {
      if (!uid || !conversationId) return;
      setUploading({ name: file.name, progress: 5 });
      try {
        const path = `${conversationId}/${uid}/${Date.now()}-${file.name}`;
        const interval = setInterval(() => {
          setUploading((prev) =>
            prev ? { ...prev, progress: Math.min(prev.progress + 10, 90) } : prev,
          );
        }, 120);
        const { error } = await supabase.storage.from('chat-media').upload(path, file);
        clearInterval(interval);
        if (error) throw error;
        const mtype: MessageRow['message_type'] = file.type.startsWith('image/')
          ? 'image'
          : file.type.startsWith('video/')
            ? 'video'
            : 'file';
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          sender_id: uid,
          message_type: mtype,
          file_url: path,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
        });
        await supabase
          .from('conversations')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', conversationId);
        setUploading({ name: file.name, progress: 100 });
        setTimeout(() => setUploading(null), 400);
      } catch (e) {
        setUploading(null);
        throw e;
      }
    },
    [uid, conversationId],
  );

  const signedUrl = useCallback(async (path: string) => {
    const { data } = await supabase.storage.from('chat-media').createSignedUrl(path, 3600);
    return data?.signedUrl ?? null;
  }, []);

  return { messages, loading, uploading, sendText, sendFile, signedUrl, markRead };
};
