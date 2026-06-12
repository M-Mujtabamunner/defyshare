import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Search, UserPlus, Users, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserAvatar } from '@/components/friends/UserAvatar';
import { useFriendsData } from '@/hooks/useFriendsData';
import { useConversations } from '@/hooks/useConversations';
import { userSlug, groupSlug } from '@/lib/slug';
import { cn } from '@/lib/utils';

interface Props {
  /** which item is currently open (for highlighting) */
  activeId?: string | null;
  onCreateGroup: () => void;
  /** Closes the sidebar on mobile after a click. */
  onItemClick?: () => void;
}

export const FriendsSidebar: React.FC<Props> = ({ activeId, onCreateGroup, onItemClick }) => {
  const { friends, unreadRequestsCount } = useFriendsData();
  const { summaries, getOrCreateDirect } = useConversations();
  const navigate = useNavigate();
  const params = useParams();
  const [q, setQ] = useState('');

  const groups = useMemo(() => summaries.filter((s) => s.conversation.type === 'group'), [
    summaries,
  ]);
  const directUnread = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of summaries) {
      if (s.conversation.type === 'direct' && s.otherUserId) {
        map.set(s.otherUserId, s.unreadCount);
      }
    }
    return map;
  }, [summaries]);

  const filteredFriends = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return friends;
    return friends.filter(
      (f) =>
        (f.custom_display_name || f.profile?.google_name || '').toLowerCase().includes(t) ||
        (f.profile?.google_email || '').toLowerCase().includes(t),
    );
  }, [friends, q]);
  const filteredGroups = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return groups;
    return groups.filter((g) => (g.group?.group_name || '').toLowerCase().includes(t));
  }, [groups, q]);

  const openFriend = async (friendId: string, name?: string | null) => {
    await getOrCreateDirect(friendId);
    navigate(`/friends/${userSlug(friendId, name)}`);
    onItemClick?.();
  };

  return (
    <aside className="flex flex-col h-full border-r border-border/50 bg-card/30 backdrop-blur-sm">
      <div className="p-3 border-b border-border/50 flex items-center gap-2">
        <Link to="/" className="md:hidden">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <h2 className="font-semibold flex-1">Messages</h2>
      </div>

      <div className="p-3 space-y-2">
        <Link to="/friends/request" onClick={onItemClick}>
          <Button variant="outline" className="w-full justify-start gap-2 relative">
            <UserPlus className="w-4 h-4" />
            Friend Requests
            {unreadRequestsCount > 0 && (
              <span className="ml-auto inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-[10px] rounded-full bg-destructive text-destructive-foreground">
                {unreadRequestsCount}
              </span>
            )}
          </Button>
        </Link>
        <Button variant="outline" className="w-full justify-start gap-2" onClick={onCreateGroup}>
          <Users className="w-4 h-4" />
          Create Group
        </Button>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search friends or groups"
            className="pl-8"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-3 pb-4 space-y-4">
          <div>
            <div className="px-1 pb-1 text-xs uppercase tracking-wide text-muted-foreground">
              Friends
            </div>
            {filteredFriends.length === 0 && (
              <p className="px-1 text-xs text-muted-foreground">No friends yet.</p>
            )}
            <ul className="space-y-0.5">
              {filteredFriends.map((f) => {
                const slug = userSlug(f.friend_id, f.profile?.google_name);
                const active = params.friendSlug === slug;
                const unread = directUnread.get(f.friend_id) ?? 0;
                return (
                  <li key={f.id}>
                    <button
                      onClick={() => openFriend(f.friend_id, f.profile?.google_name)}
                      className={cn(
                        'w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-secondary/60 transition text-left',
                        active && 'bg-secondary text-foreground',
                      )}
                    >
                      <UserAvatar name={f.profile?.google_name} photo={f.profile?.google_photo} className="h-8 w-8" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {f.custom_display_name || f.profile?.google_name || 'User'}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {f.profile?.google_email}
                        </div>
                      </div>
                      {unread > 0 && (
                        <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-[10px] rounded-full bg-destructive text-destructive-foreground">
                          {unread}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <div className="px-1 pb-1 text-xs uppercase tracking-wide text-muted-foreground">
              Groups
            </div>
            {filteredGroups.length === 0 && (
              <p className="px-1 text-xs text-muted-foreground">No groups yet.</p>
            )}
            <ul className="space-y-0.5">
              {filteredGroups.map((s) => {
                const g = s.group!;
                const slug = groupSlug(s.conversation.id, g.group_name);
                const active = params.groupSlug === slug;
                return (
                  <li key={s.conversation.id}>
                    <Link
                      to={`/friends/group/${slug}`}
                      onClick={onItemClick}
                      className={cn(
                        'w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-secondary/60 transition',
                        active && 'bg-secondary text-foreground',
                      )}
                    >
                      <UserAvatar name={g.group_name} photo={g.group_photo} className="h-8 w-8" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{g.group_name}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {s.members.length} members
                        </div>
                      </div>
                      {s.unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-[10px] rounded-full bg-destructive text-destructive-foreground">
                          {s.unreadCount}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
};
