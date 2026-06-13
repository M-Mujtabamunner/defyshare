import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ConversationRow {
  id: string;
  type: 'direct' | 'group';
  last_message_at: string | null;
  updated_at: string;
}

export interface GroupRow {
  id: string;
  conversation_id: string;
  group_name: string;
  group_photo: string | null;
  created_by: string;
}

export interface MembershipRow {
  conversation_id: string;
  user_id: string;
  role: 'admin' | 'member';
  last_read_at: string;
}

export interface ConversationSummary {
  conversation: ConversationRow;
  members: MembershipRow[];
  group?: GroupRow;
  /** For direct conversations, the other user id. */
  otherUserId?: string;
  unreadCount: number;
  lastMessagePreview?: string;
}

export const useConversations = () => {
  const { user } = useAuth();
  const uid = user?.id ?? null;

  const [memberships, setMemberships] = useState<MembershipRow[]>([]);
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [allMembers, setAllMembers] = useState<MembershipRow[]>([]);
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [unread, setUnread] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    const { data: mine } = await supabase
      .from('conversation_members')
      .select('*')
      .eq('user_id', uid);
    const mineRows = (mine ?? []) as MembershipRow[];
    setMemberships(mineRows);
    const convIds = mineRows.map((m) => m.conversation_id);
    if (convIds.length === 0) {
      setConversations([]);
      setAllMembers([]);
      setGroups([]);
      setUnread({});
      setLoading(false);
      return;
    }
    const [{ data: convs }, { data: members }, { data: grps }] = await Promise.all([
      supabase.from('conversations').select('*').in('id', convIds),
      supabase.from('conversation_members').select('*').in('conversation_id', convIds),
      supabase.from('groups').select('*').in('conversation_id', convIds),
    ]);
    setConversations((convs ?? []) as ConversationRow[]);
    setAllMembers((members ?? []) as MembershipRow[]);
    setGroups((grps ?? []) as GroupRow[]);

    // Unread counts: messages newer than my last_read_at, not sent by me
    const counts: Record<string, number> = {};
    await Promise.all(
      mineRows.map(async (m) => {
        const { count } = await supabase
          .from('messages')
          .select('id', { head: true, count: 'exact' })
          .eq('conversation_id', m.conversation_id)
          .neq('sender_id', uid)
          .gt('created_at', m.last_read_at);
        counts[m.conversation_id] = count ?? 0;
      }),
    );
    setUnread(counts);
    setLoading(false);
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    refresh();
    const channel = supabase
      .channel(`convs-${uid}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => refresh())
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversation_members' },
        () => refresh(),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, () => refresh())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [uid, refresh]);

  const summaries: ConversationSummary[] = useMemo(() => {
    return conversations.map((c) => {
      const members = allMembers.filter((m) => m.conversation_id === c.id);
      const group = groups.find((g) => g.conversation_id === c.id);
      const otherUserId =
        c.type === 'direct'
          ? members.find((m) => m.user_id !== uid)?.user_id
          : undefined;
      return {
        conversation: c,
        members,
        group,
        otherUserId,
        unreadCount: unread[c.id] ?? 0,
      };
    });
  }, [conversations, allMembers, groups, unread, uid]);

  const totalUnread = useMemo(
    () => Object.values(unread).reduce((a, b) => a + b, 0),
    [unread],
  );

  /** Find or create a direct conversation between current user and `otherId`. */
  const getOrCreateDirect = useCallback(
    async (otherId: string): Promise<string | null> => {
      if (!uid) return null;
      const { data, error } = await supabase.rpc('get_or_create_direct_conversation', {
        _other: otherId,
      });
      if (error) {
        console.error('get_or_create_direct_conversation failed', error);
        return null;
      }
      await refresh();
      return (data as string) ?? null;
    },
    [uid, refresh],
  );

  const createGroup = useCallback(
    async (
      name: string,
      memberIds: string[],
      photoUrl: string | null,
    ): Promise<string | null> => {
      if (!uid) return null;
      const { data: conv, error } = await supabase
        .from('conversations')
        .insert({ type: 'group' })
        .select('id')
        .single();
      if (error || !conv) {
        console.error('create conversation failed', error);
        return null;
      }
      // Insert self as admin FIRST so RLS sees us as admin when adding others
      const { error: selfErr } = await supabase.from('conversation_members').insert({
        conversation_id: conv.id,
        user_id: uid,
        role: 'admin',
      });
      if (selfErr) {
        console.error('add self member failed', selfErr);
        return null;
      }
      if (memberIds.length > 0) {
        const { error: othersErr } = await supabase.from('conversation_members').insert(
          memberIds.map((m) => ({
            conversation_id: conv.id,
            user_id: m,
            role: 'member' as const,
          })),
        );
        if (othersErr) {
          console.error('add other members failed', othersErr);
          return null;
        }
      }
      await supabase.from('groups').insert({
        conversation_id: conv.id,
        group_name: name,
        group_photo: photoUrl,
        created_by: uid,
      });
      await refresh();
      return conv.id;
    },
    [uid, refresh],
  );

  return {
    loading,
    memberships,
    summaries,
    totalUnread,
    getOrCreateDirect,
    createGroup,
    refresh,
  };
};
