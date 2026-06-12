import React, { useState } from 'react';
import { X, Trash2, Ban, Shield } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserAvatar } from '@/components/friends/UserAvatar';
import { useFriendsData, FriendRow } from '@/hooks/useFriendsData';
import { useToast } from '@/hooks/use-toast';

interface Props {
  friend: FriendRow | null;
  open: boolean;
  onClose: () => void;
}

export const FriendSettingsPanel: React.FC<Props> = ({ friend, open, onClose }) => {
  const { renameFriend, removeFriend, blockUser, unblockUser, blocks } = useFriendsData();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState(friend?.custom_display_name ?? '');

  React.useEffect(() => {
    setDisplayName(friend?.custom_display_name ?? '');
  }, [friend]);

  if (!friend) return null;
  const isBlocked = blocks.some((b) => b.blocked_user_id === friend.friend_id);

  const saveName = async () => {
    await renameFriend(friend.friend_id, displayName.trim() || null);
    toast({ title: 'Display name saved' });
  };

  const handleBlock = async () => {
    await blockUser(friend.friend_id);
    toast({ title: 'User blocked' });
    onClose();
  };
  const handleUnblock = async () => {
    await unblockUser(friend.friend_id);
    toast({ title: 'User unblocked' });
  };
  const handleRemove = async () => {
    await removeFriend(friend.friend_id);
    toast({ title: 'Friend removed' });
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Friend settings</SheetTitle>
        </SheetHeader>

        <div className="mt-4 flex flex-col items-center text-center gap-2">
          <UserAvatar
            name={friend.profile?.google_name}
            photo={friend.profile?.google_photo}
            className="h-20 w-20"
          />
          <div className="font-medium">{friend.profile?.google_name}</div>
          <div className="text-xs text-muted-foreground">{friend.profile?.google_email}</div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label>Custom display name</Label>
            <div className="flex gap-2">
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={friend.profile?.google_name ?? ''}
              />
              <Button onClick={saveName}>Save</Button>
            </div>
          </div>

          {isBlocked ? (
            <Button variant="outline" onClick={handleUnblock} className="w-full gap-2">
              <Shield className="w-4 h-4" /> Unblock
            </Button>
          ) : (
            <Button variant="outline" onClick={handleBlock} className="w-full gap-2">
              <Ban className="w-4 h-4" /> Block user
            </Button>
          )}
          <Button variant="destructive" onClick={handleRemove} className="w-full gap-2">
            <Trash2 className="w-4 h-4" /> Remove friend
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full gap-2">
            <X className="w-4 h-4" /> Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
