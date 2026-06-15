import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ChatView } from '@/components/friends/ChatView';
import { GroupSettingsPanel } from '@/components/friends/GroupSettingsPanel';
import { useConversations } from '@/hooks/useConversations';
import { idFromSlug } from '@/lib/slug';
import { supabase } from '@/integrations/supabase/client';
import type { ProfileRow } from '@/hooks/useFriendsData';

interface Props {
  conversationId?: string;
}

const GroupChat: React.FC<Props> = ({ conversationId }) => {
  const { groupSlug: slug } = useParams<{ groupSlug: string }>();
  const idTail = conversationId ?? idFromSlug(slug);
  const { summaries, refresh } = useConversations();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [memberProfiles, setMemberProfiles] = useState<Map<string, ProfileRow>>(new Map());

  const summary = useMemo(
    () =>
      conversationId
        ? summaries.find(
            (s) => s.conversation.type === 'group' && s.conversation.id === conversationId,
          )
        : summaries.find(
            (s) => s.conversation.type === 'group' && s.conversation.id.startsWith(idTail ?? '__'),
          ),
    [summaries, idTail, conversationId],
  );

  useEffect(() => {
    if (!summary) return;
    const ids = summary.members.map((m) => m.user_id);
    if (ids.length === 0) return;
    supabase
      .from('profiles')
      .select('user_id, google_name, google_email, google_photo')
      .in('user_id', ids)
      .then(({ data }) => {
        const map = new Map<string, ProfileRow>();
        (data ?? []).forEach((p) => map.set(p.user_id, p as ProfileRow));
        setMemberProfiles(map);
      });
  }, [summary]);

  if (!summary || !summary.group) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-sm text-muted-foreground">
        Group not found.
      </div>
    );
  }

  return (
    <>
      <ChatView
        conversationId={summary.conversation.id}
        title={summary.group.group_name}
        subtitle={`${summary.members.length} members`}
        photo={summary.group.group_photo}
        memberProfiles={memberProfiles}
        isGroup
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <GroupSettingsPanel
        summary={summary}
        memberProfiles={memberProfiles}
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onChanged={refresh}
      />
    </>
  );
};

export default GroupChat;
