import React, { useMemo, useState } from 'react';
import { X, Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserAvatar } from '@/components/friends/UserAvatar';
import { useFriendsData } from '@/hooks/useFriendsData';
import { useConversations } from '@/hooks/useConversations';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { groupSlug } from '@/lib/slug';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const CreateGroupModal: React.FC<Props> = ({ open, onClose }) => {
  const { friends } = useFriendsData();
  const { createGroup } = useConversations();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return friends;
    return friends.filter(
      (f) =>
        (f.profile?.google_name || '').toLowerCase().includes(t) ||
        (f.profile?.google_email || '').toLowerCase().includes(t),
    );
  }, [friends, q]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const submit = async () => {
    if (!name.trim()) {
      toast({ title: 'Group name required', variant: 'destructive' });
      return;
    }
    if (selected.size === 0) {
      toast({ title: 'Select at least one friend', variant: 'destructive' });
      return;
    }
    setBusy(true);
    let photoUrl: string | null = null;
    if (photoFile && user) {
      try {
        const buf = new Uint8Array(await photoFile.arrayBuffer());
        let bin = '';
        const chunk = 0x8000;
        for (let i = 0; i < buf.length; i += chunk) {
          bin += String.fromCharCode.apply(null, Array.from(buf.subarray(i, i + chunk)));
        }
        photoUrl = `data:${photoFile.type};base64,${btoa(bin)}`;
      } catch (e) {
        console.error('photo encode failed', e);
      }
    }
    const ids = Array.from(selected);
    try {
      const convId = await createGroup(name.trim(), ids, photoUrl);
      setBusy(false);
      if (!convId) {
        toast({ title: 'Could not create group', description: 'Check console for details.', variant: 'destructive' });
        return;
      }
      toast({ title: 'Group created' });
      onClose();
      setName('');
      setSelected(new Set());
      setPhotoFile(null);
      navigate(`/friends/group/${groupSlug(convId, name.trim())}`);
    } catch (err) {
      setBusy(false);
      const msg = err instanceof Error ? err.message : String(err);
      toast({ title: 'Could not create group', description: msg, variant: 'destructive' });
    }
  };


  // Avoid TS warning for unused supabase import (kept for future when we
  // switch group photos to a real bucket).
  void supabase;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create group</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            placeholder="Group name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-dashed border-border cursor-pointer hover:bg-secondary/50 text-sm">
              <Upload className="w-4 h-4" />
              {photoFile ? photoFile.name : 'Group photo (optional)'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
              />
            </label>
            {photoFile && (
              <Button variant="ghost" size="icon" onClick={() => setPhotoFile(null)}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          <Input
            placeholder="Search friends"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <ScrollArea className="h-64 border border-border/50 rounded-md">
            <ul className="p-1">
              {filtered.length === 0 && (
                <li className="p-4 text-xs text-muted-foreground text-center">
                  No friends to add.
                </li>
              )}
              {filtered.map((f) => {
                const sel = selected.has(f.friend_id);
                return (
                  <li key={f.id}>
                    <button
                      onClick={() => toggle(f.friend_id)}
                      className={cn(
                        'w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-secondary/60 transition text-left',
                        sel && 'bg-primary/15 ring-1 ring-primary/40',
                      )}
                    >
                      <UserAvatar
                        name={f.profile?.google_name}
                        photo={f.profile?.google_photo}
                        className="h-8 w-8"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {f.profile?.google_name || 'User'}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {f.profile?.google_email}
                        </div>
                      </div>
                      {sel && (
                        <span className="text-[10px] text-primary font-medium">SELECTED</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? 'Creating…' : 'Create group'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
