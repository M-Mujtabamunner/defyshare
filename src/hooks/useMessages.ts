import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getB2UploadUrl, getSignedChatUrl, toB2Path } from '@/lib/storageUrls';


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
  expires_at: string | null;
}

export interface ReactionRow {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
}

export const useMessages = (conversationId: string | null) => {
  const { user } = useAuth();
  const uid = user?.id ?? null;
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [reactions, setReactions] = useState<ReactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<{ name: string; progress: number } | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setReactions([]);
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
        // load reactions for these messages
        const ids = (data ?? []).map((m: any) => m.id);
        if (ids.length) {
          (supabase as any)
            .from('message_reactions')
            .select('*')
            .in('message_id', ids)
            .then(({ data: rx }: any) => {
              if (active) setReactions((rx ?? []) as ReactionRow[]);
            });
        } else {
          setReactions([]);
        }
      });

    const channel = supabase
      .channel(`msgs-${conversationId}-${Math.random().toString(36).slice(2)}`)
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
            const msg = payload.new as MessageRow;
            setMessages((prev) =>
              prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
            );
            if (uid && msg.sender_id !== uid) {
              supabase
                .from('conversation_members')
                .update({ last_read_at: new Date().toISOString() })
                .eq('conversation_id', conversationId)
                .eq('user_id', uid)
                .then(() => {});
            }
          } else if (payload.eventType === 'DELETE') {
            setMessages((prev) => prev.filter((m) => m.id !== (payload.old as MessageRow).id));
          }
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'message_reactions' },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            const r = payload.new as ReactionRow;
            setReactions((prev) => (prev.some((x) => x.id === r.id) ? prev : [...prev, r]));
          } else if (payload.eventType === 'DELETE') {
            setReactions((prev) => prev.filter((x) => x.id !== (payload.old as ReactionRow).id));
          }
        },
      )
      .on('broadcast', { event: 'typing' }, (payload: any) => {
        const u = payload?.payload?.userId as string | undefined;
        if (!u || u === uid) return;
        setTypingUsers((prev) => ({ ...prev, [u]: Date.now() }));
      })
      .subscribe();

    // expire typing indicators
    const tInt = setInterval(() => {
      setTypingUsers((prev) => {
        const now = Date.now();
        const out: Record<string, number> = {};
        for (const [k, v] of Object.entries(prev)) {
          if (now - v < 4000) out[k] = v;
        }
        return out;
      });
    }, 1500);

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
      clearInterval(tInt);
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
        const key = `${conversationId}/${uid}/${Date.now()}-${file.name}`;
        const filePath = toB2Path(key);
        const interval = setInterval(() => {
          setUploading((prev) =>
            prev ? { ...prev, progress: Math.min(prev.progress + 10, 90) } : prev,
          );
        }, 120);
        const uploadUrl = await getB2UploadUrl(key, file.type);
        const putRes = await fetch(uploadUrl, { method: 'PUT', body: file });
        clearInterval(interval);
        if (!putRes.ok) throw new Error(`Upload failed (${putRes.status})`);
        const mtype: MessageRow['message_type'] = file.type.startsWith('image/')
          ? 'image'
          : file.type.startsWith('video/')
            ? 'video'
            : 'file';
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          sender_id: uid,
          message_type: mtype,
          file_url: filePath,
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

  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!uid) return;
      const existing = reactions.find(
        (r) => r.message_id === messageId && r.user_id === uid && r.emoji === emoji,
      );
      if (existing) {
        await (supabase as any).from('message_reactions').delete().eq('id', existing.id);
      } else {
        await (supabase as any)
          .from('message_reactions')
          .insert({ message_id: messageId, user_id: uid, emoji });
      }
    },
    [uid, reactions],
  );

  const broadcastTyping = useCallback(() => {
    if (!uid || !conversationId) return;
    supabase
      .channel(`msgs-typing-${conversationId}`, { config: { broadcast: { self: false } } })
      .send({ type: 'broadcast', event: 'typing', payload: { userId: uid } })
      .catch(() => {});
  }, [uid, conversationId]);

  const signedUrl = useCallback(async (path: string) => {
    return await getSignedChatUrl(path);
  }, []);

  return {
    messages,
    reactions,
    loading,
    uploading,
    typingUsers,
    sendText,
    sendFile,
    signedUrl,
    markRead,
    toggleReaction,
    broadcastTyping,
  };
};
