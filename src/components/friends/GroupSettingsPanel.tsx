import React, { useState } from 'react';
import { X, Trash2, LogOut, UserPlus, UserMinus } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserAvatar } from '@/components/friends/UserAvatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useFriendsData, ProfileRow } from '@/hooks/useFriendsData';
import type { ConversationSummary } from '@/hooks/useConversations';
import { useNavigate } from 'react-router-dom';

interface Props {
  summary: ConversationSummary | null;
  memberProfiles: Map<string, ProfileRow>;
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
}

export const GroupSettingsPanel: React.FC<Props> = ({
  summary,
  memberProfiles,
  open,
  onClose,
  onChanged,
}) => {
  const { user } = useAuth();
  const { friends } = useFriendsData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState(summary?.group?.group_name ?? '');
  const [adding, setAdding] = useState(false);

  React.useEffect(() => {
    setName(summary?.group?.group_name ?? '');
  }, [summary]);

  if (!summary || !summary.group) return null;
  const conv = summary.conversation;
  const group = summary.group;
  const uid = user?.id;
  const me = summary.members.find((m) => m.user_id === uid);
  const isAdmin = me?.role === 'admin';
  const memberIds = new Set(summary.members.map((m) => m.user_id));
  const addable = friends.filter((f) => !memberIds.has(f.friend_id));

  const rename = async () => {
    await supabase.from('groups').update({ group_name: name.trim() }).eq('id', group.id);
    toast({ title: 'Group renamed' });
    onChanged();
  };

  const addMember = async (friendId: string) => {
    await supabase.from('conversation_members').insert({
      conversation_id: conv.id,
      user_id: friendId,
      role: 'member',
    });
    onChanged();
    toast({ title: 'Member added' });
  };
  const removeMember = async (memberId: string) => {
    await supabase
      .from('conversation_members')
      .delete()
      .eq('conversation_id', conv.id)
      .eq('user_id', memberId);
    onChanged();
    toast({ title: 'Member removed' });
  };
  const leave = async () => {
    if (!uid) return;
    await supabase
      .from('conversation_members')
      .delete()
      .eq('conversation_id', conv.id)
      .eq('user_id', uid);
    onClose();
    navigate('/friends');
  };
  const deleteGroup = async () => {
    await supabase.from('conversations').delete().eq('id', conv.id);
    onClose();
    navigate('/friends');
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Group settings</SheetTitle>
        </SheetHeader>

        <div className="mt-4 flex flex-col items-center text-center gap-2">
          <UserAvatar
            name={group.group_name}
            photo={group.group_photo}
            className="h-20 w-20"
          />
          <div className="font-medium">{group.group_name}</div>
          <div className="text-xs text-muted-foreground">{summary.members.length} members</div>
        </div>

        <div className="mt-6 space-y-4">
          {isAdmin && (
            <div className="space-y-2">
              <Label>Group name</Label>
              <div className="flex gap-2">
                <Input value={name} onChange={(e) => setName(e.target.value)} />
                <Button onClick={rename}>Save</Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Members</Label>
            <ScrollArea className="h-48 border border-border/50 rounded-md">
              <ul className="p-1">
                {summary.members.map((m) => {
                  const p = memberProfiles.get(m.user_id);
                  return (
                    <li
                      key={m.user_id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-secondary/50"
                    >
                      <UserAvatar name={p?.google_name} photo={p?.google_photo} className="h-8 w-8" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm">{p?.google_name || 'User'}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {p?.google_email}
                        </div>
                      </div>
                      {m.role === 'admin' && (
                        <span className="text-[10px] text-primary">ADMIN</span>
                      )}
                      {isAdmin && m.user_id !== uid && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeMember(m.user_id)}
                          aria-label="Remove"
                        >
                          <UserMinus className="w-4 h-4" />
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>
          </div>

          {isAdmin && (
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={() => setAdding((v) => !v)}
                className="w-full gap-2"
              >
                <UserPlus className="w-4 h-4" /> {adding ? 'Hide' : 'Add members'}
              </Button>
              {adding && (
                <ScrollArea className="h-40 border border-border/50 rounded-md">
                  <ul className="p-1">
                    {addable.length === 0 && (
                      <li className="p-4 text-xs text-muted-foreground text-center">
                        No more friends to add.
                      </li>
                    )}
                    {addable.map((f) => (
                      <li
                        key={f.id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-secondary/50"
                      >
                        <UserAvatar
                          name={f.profile?.google_name}
                          photo={f.profile?.google_photo}
                          className="h-8 w-8"
                        />
                        <div className="min-w-0 flex-1 truncate text-sm">
                          {f.profile?.google_name}
                        </div>
                        <Button size="sm" onClick={() => addMember(f.friend_id)}>
                          Add
                        </Button>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              )}
            </div>
          )}

          <Button variant="outline" onClick={leave} className="w-full gap-2">
            <LogOut className="w-4 h-4" /> Leave group
          </Button>
          {isAdmin && (
            <Button variant="destructive" onClick={deleteGroup} className="w-full gap-2">
              <Trash2 className="w-4 h-4" /> Delete group
            </Button>
          )}
          <Button variant="ghost" onClick={onClose} className="w-full gap-2">
            <X className="w-4 h-4" /> Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
