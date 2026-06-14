import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ProfileRow {
  user_id: string;
  google_name: string | null;
  google_email: string | null;
  google_photo: string | null;
}

export interface FriendRow {
  id: string;
  user_id: string;
  friend_id: string;
  custom_display_name: string | null;
  created_at: string;
  profile?: ProfileRow;
}

export interface FriendRequestRow {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  is_read: boolean;
  created_at: string;
  profile?: ProfileRow;
}

export interface BlockRow {
  id: string;
  blocker_id: string;
  blocked_user_id: string;
  created_at: string;
  profile?: ProfileRow;
}

const profileFor = (id: string, map: Map<string, ProfileRow>): ProfileRow | undefined =>
  map.get(id);

export const useFriendsData = () => {
  const { user } = useAuth();
  const uid = user?.id ?? null;

  const [friends, setFriends] = useState<FriendRow[]>([]);
  const [received, setReceived] = useState<FriendRequestRow[]>([]);
  const [sent, setSent] = useState<FriendRequestRow[]>([]);
  const [blocks, setBlocks] = useState<BlockRow[]>([]);
  const [profiles, setProfiles] = useState<Map<string, ProfileRow>>(new Map());
  const [loading, setLoading] = useState(true);

  const refreshProfiles = useCallback(async (ids: string[]) => {
    const unique = Array.from(new Set(ids)).filter(Boolean);
    if (unique.length === 0) return;
    const { data } = await supabase
      .from('profiles')
      .select('user_id, google_name, google_email, google_photo')
      .in('user_id', unique);
    if (data) {
      setProfiles((prev) => {
        const next = new Map(prev);
        for (const p of data) next.set(p.user_id, p as ProfileRow);
        return next;
      });
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    const [f, recv, snt, blk] = await Promise.all([
      supabase.from('friends').select('*').eq('user_id', uid),
      supabase.from('friend_requests').select('*').eq('receiver_id', uid).eq('status', 'pending'),
      supabase.from('friend_requests').select('*').eq('sender_id', uid).eq('status', 'pending'),
      supabase.from('blocked_users').select('*').eq('blocker_id', uid),
    ]);
    setFriends((f.data ?? []) as FriendRow[]);
    setReceived((recv.data ?? []) as FriendRequestRow[]);
    setSent((snt.data ?? []) as FriendRequestRow[]);
    setBlocks((blk.data ?? []) as BlockRow[]);
    const ids: string[] = [
      ...(f.data ?? []).map((r) => r.friend_id),
      ...(recv.data ?? []).map((r) => r.sender_id),
      ...(snt.data ?? []).map((r) => r.receiver_id),
      ...(blk.data ?? []).map((r) => r.blocked_user_id),
    ];
    await refreshProfiles(ids);
    setLoading(false);
  }, [uid, refreshProfiles]);

  useEffect(() => {
    if (!uid) return;
    refresh();
    const channel = supabase
      .channel(`friends-${uid}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests' }, () =>
        refresh(),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friends' }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blocked_users' }, () =>
        refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [uid, refresh]);

  const decoratedFriends = useMemo(
    () =>
      friends.map((f) => ({ ...f, profile: profileFor(f.friend_id, profiles) })),
    [friends, profiles],
  );
  const decoratedReceived = useMemo(
    () => received.map((r) => ({ ...r, profile: profileFor(r.sender_id, profiles) })),
    [received, profiles],
  );
  const decoratedSent = useMemo(
    () => sent.map((r) => ({ ...r, profile: profileFor(r.receiver_id, profiles) })),
    [sent, profiles],
  );
  const decoratedBlocks = useMemo(
    () => blocks.map((r) => ({ ...r, profile: profileFor(r.blocked_user_id, profiles) })),
    [blocks, profiles],
  );

  const unreadRequestsCount = useMemo(
    () => received.filter((r) => !r.is_read).length,
    [received],
  );

  // Actions
  const sendFriendRequest = useCallback(
    async (
      emailOrUserId: string,
      opts?: { byUserId?: boolean },
    ): Promise<{ ok: boolean; reason?: string }> => {
      if (!uid) return { ok: false, reason: 'Sign in first' };
      let targetId: string | null = null;

      if (opts?.byUserId) {
        targetId = emailOrUserId;
      } else {
        const clean = emailOrUserId.trim().toLowerCase();
        if (!clean) return { ok: false, reason: 'Enter an email' };
        const { data, error } = await (supabase as any).rpc('find_profile_by_email', {
          _email: clean,
        });
        if (error) return { ok: false, reason: error.message };
        const row = Array.isArray(data) ? data[0] : data;
        if (!row?.user_id) {
          return {
            ok: false,
            reason: 'User not found. They need to sign in to DefyShare first.',
          };
        }
        targetId = row.user_id as string;
      }

      if (!targetId) return { ok: false, reason: 'User not found.' };
      if (targetId === uid) return { ok: false, reason: "You can't friend yourself." };
      if (blocks.some((b) => b.blocked_user_id === targetId)) {
        return { ok: false, reason: 'You blocked this user. Unblock to send a request.' };
      }
      if (friends.some((f) => f.friend_id === targetId)) {
        return { ok: false, reason: 'Already friends.' };
      }
      if (
        sent.some((r) => r.receiver_id === targetId) ||
        received.some((r) => r.sender_id === targetId)
      ) {
        return { ok: false, reason: 'A pending request already exists.' };
      }
      const { error } = await supabase.from('friend_requests').insert({
        sender_id: uid,
        receiver_id: targetId,
      });
      if (error) return { ok: false, reason: error.message };
      await refresh();
      return { ok: true };
    },
    [uid, blocks, friends, sent, received, refresh],
  );

  const acceptRequest = useCallback(
    async (req: FriendRequestRow) => {
      if (!uid) return;
      const { error } = await supabase.rpc('accept_friend_request', { _req_id: req.id });
      if (error) {
        console.error('accept_friend_request failed', error);
      }
      await refresh();
    },
    [uid, refresh],
  );

  const rejectRequest = useCallback(
    async (req: FriendRequestRow) => {
      await supabase
        .from('friend_requests')
        .update({ status: 'rejected', is_read: true })
        .eq('id', req.id);
      await refresh();
    },
    [refresh],
  );

  const cancelRequest = useCallback(
    async (req: FriendRequestRow) => {
      await supabase.from('friend_requests').delete().eq('id', req.id);
      await refresh();
    },
    [refresh],
  );

  const markRequestsRead = useCallback(async () => {
    if (!uid) return;
    const unread = received.filter((r) => !r.is_read).map((r) => r.id);
    if (unread.length === 0) return;
    await supabase.from('friend_requests').update({ is_read: true }).in('id', unread);
    await refresh();
  }, [uid, received, refresh]);

  const blockUser = useCallback(
    async (targetId: string) => {
      if (!uid) return;
      // Optimistic: immediately reflect block + remove friend locally
      const tempBlock: BlockRow = {
        id: `temp-${targetId}`,
        blocker_id: uid,
        blocked_user_id: targetId,
        created_at: new Date().toISOString(),
      };
      setBlocks((prev) =>
        prev.some((b) => b.blocked_user_id === targetId) ? prev : [...prev, tempBlock],
      );
      setFriends((prev) => prev.filter((f) => f.friend_id !== targetId));
      setReceived((prev) => prev.filter((r) => r.sender_id !== targetId));
      setSent((prev) => prev.filter((r) => r.receiver_id !== targetId));

      await supabase.from('blocked_users').upsert(
        { blocker_id: uid, blocked_user_id: targetId },
        { onConflict: 'blocker_id,blocked_user_id', ignoreDuplicates: true },
      );
      await supabase
        .from('friend_requests')
        .delete()
        .or(
          `and(sender_id.eq.${uid},receiver_id.eq.${targetId}),and(sender_id.eq.${targetId},receiver_id.eq.${uid})`,
        );
      await supabase
        .from('friends')
        .delete()
        .eq('user_id', uid)
        .eq('friend_id', targetId);
      await refresh();
    },
    [uid, refresh],
  );

  const unblockUser = useCallback(
    async (targetId: string) => {
      if (!uid) return;
      // Optimistic: remove block locally
      setBlocks((prev) => prev.filter((b) => b.blocked_user_id !== targetId));
      await supabase
        .from('blocked_users')
        .delete()
        .eq('blocker_id', uid)
        .eq('blocked_user_id', targetId);
      await refresh();
    },
    [uid, refresh],
  );

  const removeFriend = useCallback(
    async (friendId: string) => {
      if (!uid) return;
      // Optimistic: remove friend locally
      setFriends((prev) => prev.filter((f) => f.friend_id !== friendId));
      await supabase
        .from('friends')
        .delete()
        .or(
          `and(user_id.eq.${uid},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${uid})`,
        );
      await refresh();
    },
    [uid, refresh],
  );


  const renameFriend = useCallback(
    async (friendId: string, name: string | null) => {
      if (!uid) return;
      await supabase
        .from('friends')
        .update({ custom_display_name: name })
        .eq('user_id', uid)
        .eq('friend_id', friendId);
      await refresh();
    },
    [uid, refresh],
  );

  const searchPeople = useCallback(
    async (q: string): Promise<ProfileRow[]> => {
      const term = q.trim();
      if (term.length < 2) return [];
      const { data, error } = await (supabase as any).rpc('search_profiles', { _q: term });
      if (error || !data) return [];
      return data as ProfileRow[];
    },
    [],
  );



  return {
    loading,
    friends: decoratedFriends,
    received: decoratedReceived,
    sent: decoratedSent,
    blocks: decoratedBlocks,
    unreadRequestsCount,
    profiles,
    refresh,
    sendFriendRequest,
    acceptRequest,
    rejectRequest,
    cancelRequest,
    markRequestsRead,
    blockUser,
    unblockUser,
    removeFriend,
    renameFriend,
    searchPeople,
  };
};
