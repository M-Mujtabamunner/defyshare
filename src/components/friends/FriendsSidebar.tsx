import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { FriendsSelection } from '@/pages/FriendsLayout';
import {
  Search,
  UserPlus,
  Users,
  ArrowLeft,
  MoreVertical,
  Pin,
  PinOff,
  CheckCheck,
  UserMinus,
  LogOut,
  MessageSquare,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserAvatar } from '@/components/friends/UserAvatar';
import { useFriendsData } from '@/hooks/useFriendsData';
import { useConversations } from '@/hooks/useConversations';
import { usePinnedConversations } from '@/hooks/usePinnedConversations';
import { userSlug, groupSlug, idFromSlug } from '@/lib/slug';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Props {
  activeSelection: FriendsSelection;
  onSelectFriend: (friendId: string, name?: string | null) => void;
  onSelectGroup: (conversationId: string, slug: string) => void;
  onBack?: () => void;
  onCreateGroup: () => void;
  onItemClick?: () => void;
}

interface RowActionsProps {
  onPin: () => void;
  isPinned: boolean;
  onMarkRead: () => void;
  hasUnread: boolean;
  onOpen: () => void;
  onRemove?: () => void;
  removeLabel?: string;
  removeIcon?: React.ReactNode;
}

const RowMenuItems: React.FC<RowActionsProps> = ({
  onPin,
  isPinned,
  onMarkRead,
  hasUnread,
  onOpen,
  onRemove,
  removeLabel,
  removeIcon,
}) => (
  <>
    <ContextMenuItem onSelect={onOpen}>
      <MessageSquare className="w-4 h-4 mr-2" /> Open chat
    </ContextMenuItem>
    <ContextMenuItem onSelect={onPin}>
      {isPinned ? (
        <>
          <PinOff className="w-4 h-4 mr-2" /> Unpin
        </>
      ) : (
        <>
          <Pin className="w-4 h-4 mr-2" /> Pin to top
        </>
      )}
    </ContextMenuItem>
    <ContextMenuItem onSelect={onMarkRead} disabled={!hasUnread}>
      <CheckCheck className="w-4 h-4 mr-2" /> Mark as read
    </ContextMenuItem>
    {onRemove && (
      <>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={onRemove} className="text-destructive focus:text-destructive">
          {removeIcon ?? <UserMinus className="w-4 h-4 mr-2" />} {removeLabel}
        </ContextMenuItem>
      </>
    )}
  </>
);

const DropdownItems: React.FC<RowActionsProps> = ({
  onPin,
  isPinned,
  onMarkRead,
  hasUnread,
  onOpen,
  onRemove,
  removeLabel,
  removeIcon,
}) => (
  <>
    <DropdownMenuItem onSelect={onOpen}>
      <MessageSquare className="w-4 h-4 mr-2" /> Open chat
    </DropdownMenuItem>
    <DropdownMenuItem onSelect={onPin}>
      {isPinned ? (
        <>
          <PinOff className="w-4 h-4 mr-2" /> Unpin
        </>
      ) : (
        <>
          <Pin className="w-4 h-4 mr-2" /> Pin to top
        </>
      )}
    </DropdownMenuItem>
    <DropdownMenuItem onSelect={onMarkRead} disabled={!hasUnread}>
      <CheckCheck className="w-4 h-4 mr-2" /> Mark as read
    </DropdownMenuItem>
    {onRemove && (
      <>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onRemove} className="text-destructive focus:text-destructive">
          {removeIcon ?? <UserMinus className="w-4 h-4 mr-2" />} {removeLabel}
        </DropdownMenuItem>
      </>
    )}
  </>
);

export const FriendsSidebar: React.FC<Props> = ({
  activeSelection,
  onSelectFriend,
  onSelectGroup,
  onCreateGroup,
  onItemClick,
}) => {
  const { user } = useAuth();
  const { friends, unreadRequestsCount, removeFriend } = useFriendsData();
  const { summaries, getOrCreateDirect, markAsRead } = useConversations();
  const { isPinned, togglePin } = usePinnedConversations();
  const [q, setQ] = useState('');

  const groups = useMemo(() => summaries.filter((s) => s.conversation.type === 'group'), [
    summaries,
  ]);
  const activeFriendId =
    activeSelection?.kind === 'friend' ? activeSelection.friendId : null;
  const activeGroupConvId =
    activeSelection?.kind === 'group' ? activeSelection.conversationId : null;

  const directConvByOther = useMemo(() => {
    const m = new Map<string, { conversationId: string; unread: number }>();
    for (const s of summaries) {
      if (s.conversation.type === 'direct' && s.otherUserId) {
        const isActive = activeFriendId === s.otherUserId;
        m.set(s.otherUserId, {
          conversationId: s.conversation.id,
          unread: isActive ? 0 : s.unreadCount,
        });
      }
    }
    return m;
  }, [summaries, activeFriendId]);

  const filteredFriends = useMemo(() => {
    const t = q.trim().toLowerCase();
    const base = !t
      ? friends
      : friends.filter(
          (f) =>
            (f.custom_display_name || f.profile?.google_name || '')
              .toLowerCase()
              .includes(t) ||
            (f.profile?.google_email || '').toLowerCase().includes(t),
        );
    return [...base].sort((a, b) => {
      const ap = directConvByOther.get(a.friend_id);
      const bp = directConvByOther.get(b.friend_id);
      const aPinned = ap ? isPinned(ap.conversationId) : false;
      const bPinned = bp ? isPinned(bp.conversationId) : false;
      if (aPinned !== bPinned) return aPinned ? -1 : 1;
      return 0;
    });
  }, [friends, q, isPinned, directConvByOther]);

  const filteredGroups = useMemo(() => {
    const t = q.trim().toLowerCase();
    const base = !t
      ? groups
      : groups.filter((g) => (g.group?.group_name || '').toLowerCase().includes(t));
    return [...base].sort((a, b) => {
      const aP = isPinned(a.conversation.id);
      const bP = isPinned(b.conversation.id);
      if (aP !== bP) return aP ? -1 : 1;
      return 0;
    });
  }, [groups, q, isPinned]);

  const openFriend = async (friendId: string, name?: string | null) => {
    // fire-and-forget; ChatView opens immediately
    getOrCreateDirect(friendId);
    onSelectFriend(friendId, name);
    onItemClick?.();
  };

  const openGroup = (conversationId: string, slug: string) => {
    onSelectGroup(conversationId, slug);
    onItemClick?.();
  };

  const leaveGroup = async (conversationId: string) => {
    if (!user) return;
    if (!confirm('Leave this group?')) return;
    const { error } = await supabase
      .from('conversation_members')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id);
    if (error) toast.error(error.message);
    else toast.success('Left group');
  };

  return (
    <aside className="flex flex-col h-full border-r border-border/50 bg-card/30 backdrop-blur-sm">
      <div className="p-3 border-b border-border/50 flex items-center gap-2">
        <Link to="/" className="md:hidden">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
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
                const conv = directConvByOther.get(f.friend_id);
                const convId = conv?.conversationId;
                const unread = conv?.unread ?? 0;
                const pinned = convId ? isPinned(convId) : false;

                const actions: RowActionsProps = {
                  onPin: () => {
                    if (convId) togglePin(convId);
                    else toast.message('Open the chat first to pin it');
                  },
                  isPinned: pinned,
                  onMarkRead: () => convId && markAsRead(convId),
                  hasUnread: unread > 0,
                  onOpen: () => openFriend(f.friend_id, f.profile?.google_name),
                  onRemove: () => {
                    if (confirm('Remove this friend?')) removeFriend(f.friend_id);
                  },
                  removeLabel: 'Remove friend',
                  removeIcon: <UserMinus className="w-4 h-4 mr-2" />,
                };

                return (
                  <li key={f.id}>
                    <ContextMenu>
                      <ContextMenuTrigger asChild>
                        <div
                          className={cn(
                            'group/row relative w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-secondary/60 transition',
                            active && 'bg-secondary text-foreground',
                          )}
                        >
                          <button
                            onClick={() => openFriend(f.friend_id, f.profile?.google_name)}
                            className="flex items-center gap-2 min-w-0 flex-1 text-left"
                          >
                            <div className="relative">
                              <UserAvatar
                                name={f.profile?.google_name}
                                photo={f.profile?.google_photo}
                                className="h-8 w-8"
                              />
                              {pinned && (
                                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                                  <Pin className="w-2.5 h-2.5" />
                                </span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium">
                                {f.custom_display_name || f.profile?.google_name || 'User'}
                              </div>
                              <div className="truncate text-xs text-muted-foreground">
                                {f.profile?.google_email}
                              </div>
                            </div>
                          </button>
                          {unread > 0 && (
                            <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-[10px] rounded-full bg-destructive text-destructive-foreground">
                              {unread}
                            </span>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 opacity-0 group-hover/row:opacity-100 focus:opacity-100 data-[state=open]:opacity-100 transition"
                                onClick={(e) => e.stopPropagation()}
                                aria-label="More options"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownItems {...actions} />
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </ContextMenuTrigger>
                      <ContextMenuContent className="w-48">
                        <RowMenuItems {...actions} />
                      </ContextMenuContent>
                    </ContextMenu>
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
                const convId = s.conversation.id;
                const pinned = isPinned(convId);
                const showUnread =
                  s.unreadCount > 0 &&
                  !(activeGroupIdTail && convId.startsWith(activeGroupIdTail));

                const actions: RowActionsProps = {
                  onPin: () => togglePin(convId),
                  isPinned: pinned,
                  onMarkRead: () => markAsRead(convId),
                  hasUnread: showUnread,
                  onOpen: () => {
                    navigate(`/friends/group/${slug}`);
                    onItemClick?.();
                  },
                  onRemove: () => leaveGroup(convId),
                  removeLabel: 'Leave group',
                  removeIcon: <LogOut className="w-4 h-4 mr-2" />,
                };

                return (
                  <li key={convId}>
                    <ContextMenu>
                      <ContextMenuTrigger asChild>
                        <div
                          className={cn(
                            'group/row relative w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-secondary/60 transition',
                            active && 'bg-secondary text-foreground',
                          )}
                        >
                          <Link
                            to={`/friends/group/${slug}`}
                            onClick={onItemClick}
                            className="flex items-center gap-2 min-w-0 flex-1"
                          >
                            <div className="relative">
                              <UserAvatar
                                name={g.group_name}
                                photo={g.group_photo}
                                className="h-8 w-8"
                              />
                              {pinned && (
                                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                                  <Pin className="w-2.5 h-2.5" />
                                </span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium">{g.group_name}</div>
                              <div className="truncate text-xs text-muted-foreground">
                                {s.members.length} members
                              </div>
                            </div>
                          </Link>
                          {showUnread && (
                            <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-[10px] rounded-full bg-destructive text-destructive-foreground">
                              {s.unreadCount}
                            </span>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 opacity-0 group-hover/row:opacity-100 focus:opacity-100 data-[state=open]:opacity-100 transition"
                                onClick={(e) => e.stopPropagation()}
                                aria-label="More options"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownItems {...actions} />
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </ContextMenuTrigger>
                      <ContextMenuContent className="w-48">
                        <RowMenuItems {...actions} />
                      </ContextMenuContent>
                    </ContextMenu>
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
