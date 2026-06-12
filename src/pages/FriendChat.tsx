import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ChatView } from '@/components/friends/ChatView';
import { FriendSettingsPanel } from '@/components/friends/FriendSettingsPanel';
import { useFriendsData } from '@/hooks/useFriendsData';
import { useConversations } from '@/hooks/useConversations';
import { idFromSlug } from '@/lib/slug';

const FriendChat: React.FC = () => {
  const { friendSlug } = useParams<{ friendSlug: string }>();
  const idTail = idFromSlug(friendSlug);
  const { friends, blocks, profiles } = useFriendsData();
  const { getOrCreateDirect } = useConversations();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const friend = useMemo(
    () => friends.find((f) => f.friend_id.startsWith(idTail ?? '__')),
    [friends, idTail],
  );

  useEffect(() => {
    let active = true;
    if (friend) {
      getOrCreateDirect(friend.friend_id).then((cid) => {
        if (active) setConversationId(cid);
      });
    }
    return () => {
      active = false;
    };
  }, [friend, getOrCreateDirect]);

  if (!friend) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-sm text-muted-foreground">
        Friend not found.
      </div>
    );
  }

  const blockedByMe = blocks.some((b) => b.blocked_user_id === friend.friend_id);
  const memberProfiles = new Map(profiles);

  return (
    <>
      <ChatView
        conversationId={conversationId}
        title={friend.custom_display_name || friend.profile?.google_name || 'User'}
        subtitle={friend.profile?.google_email ?? undefined}
        photo={friend.profile?.google_photo}
        memberProfiles={memberProfiles}
        disabledNotice={blockedByMe ? 'You blocked this user. Unblock to message again.' : null}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <FriendSettingsPanel
        friend={friend}
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
};

export default FriendChat;
