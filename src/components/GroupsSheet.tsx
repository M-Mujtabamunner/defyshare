import React, { useEffect, useState } from 'react';
import { Check, Crown, LogOut, Plus, Trash2, UserPlus, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { MemberAvatar } from '@/components/MemberPicker';
import type { Group } from '@/hooks/useGroups';
import type { Member } from '@/hooks/useOnlinePresence';
import type { Peer } from '@/lib/recipients';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export interface GroupActions {
  createGroup: (name: string, people?: Peer[]) => Promise<string>;
  renameGroup: (groupId: string, name: string) => Promise<void>;
  invite: (group: { id: string; name: string }, people: Peer[]) => Promise<void>;
  removeMember: (groupId: string, deviceId: string) => Promise<void>;
  cancelInvite: (groupId: string, deviceId: string) => Promise<void>;
  leaveGroup: (groupId: string) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
}

interface GroupsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: Group[];
  members: Member[];
  meId: string;
  actions: GroupActions;
  onInvited: () => void;
}

const GroupName: React.FC<{ group: Group; onRename: (name: string) => void }> = ({ group, onRename }) => {
  const [draft, setDraft] = useState(group.name);
  useEffect(() => setDraft(group.name), [group.name]);

  if (!group.isOwner) return <p className="font-semibold truncate">{group.name}</p>;
  const save = () => {
    if (draft.trim() && draft.trim() !== group.name) onRename(draft);
    else setDraft(group.name);
  };
  return (
    <input
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        if (e.key === 'Escape') {
          setDraft(group.name);
          (e.target as HTMLInputElement).blur();
        }
      }}
      maxLength={32}
      aria-label={group.name}
      className="w-full min-w-0 bg-transparent font-semibold rounded-md px-1.5 py-0.5 -mx-1.5 hover:bg-secondary focus:bg-background focus:outline-none focus:ring-2 focus:ring-ring/40"
    />
  );
};

const GroupCard: React.FC<{
  group: Group;
  members: Member[];
  meId: string;
  actions: GroupActions;
  onInvited: () => void;
}> = ({ group, members, meId, actions, onInvited }) => {
  const { t } = useT();
  const [adding, setAdding] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const liveName = (p: Peer) => members.find((m) => m.id === p.id)?.name ?? p.name;

  const inGroup = new Set([...group.members.map((m) => m.id), ...group.invited.map((m) => m.id)]);
  const candidates = members.filter((m) => !inGroup.has(m.id));

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  const sendInvites = () =>
    run(async () => {
      await actions.invite(
        group,
        candidates.filter((c) => picked.has(c.id)).map((c) => ({ id: c.id, name: c.name })),
      );
      setPicked(new Set());
      setAdding(false);
      onInvited();
    });

  return (
    <div className="rounded-xl border border-border bg-card p-3 space-y-2.5">
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex-1 min-w-0">
          <GroupName group={group} onRename={(name) => actions.renameGroup(group.id, name)} />
          <p className="text-[11px] text-muted-foreground px-0.5">{(group.members.length === 1 ? t('oneMember') : t('nMembers', { n: group.members.length }))}</p>
        </div>
      </div>

      <ul className="space-y-1">
        {group.members.map((m) => (
          <li key={m.id} className="flex items-center gap-2 text-sm min-w-0">
            <MemberAvatar id={m.id} name={liveName(m)} size="sm" />
            <span className="truncate flex-1">{liveName(m)}</span>
            {m.id === group.owner.id ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-primary shrink-0">
                <Crown className="w-3 h-3" />
                {t('owner')}
              </span>
            ) : (
              group.isOwner && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run(() => actions.removeMember(group.id, m.id))}
                  aria-label={t('remove')}
                  title={t('remove')}
                  className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )
            )}
          </li>
        ))}
        {group.invited.map((m) => (
          <li key={m.id} className="flex items-center gap-2 text-sm min-w-0 opacity-70">
            <MemberAvatar id={m.id} name={liveName(m)} size="sm" />
            <span className="truncate flex-1">{liveName(m)}</span>
            <span className="text-[11px] text-muted-foreground shrink-0">{t('invited')}</span>
            {group.isOwner && (
              <button
                type="button"
                disabled={busy}
                onClick={() => run(() => actions.cancelInvite(group.id, m.id))}
                aria-label={t('cancel')}
                title={t('cancel')}
                className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </li>
        ))}
      </ul>

      {group.isOwner && adding && (
        <div className="rounded-lg border border-border/70 p-1.5 space-y-0.5">
          {candidates.length === 0 ? (
            <p className="px-1.5 py-2 text-xs text-muted-foreground">{t('nobodyToInvite')}</p>
          ) : (
            candidates.map((c) => {
              const on = picked.has(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() =>
                    setPicked((prev) => {
                      const next = new Set(prev);
                      if (on) next.delete(c.id);
                      else next.add(c.id);
                      return next;
                    })
                  }
                  className={cn('w-full flex items-center gap-2 rounded-md px-1.5 py-1.5 text-sm text-start', on ? 'bg-primary/10' : 'hover:bg-secondary')}
                >
                  <MemberAvatar id={c.id} name={c.name} online={c.online} size="sm" />
                  <span className="truncate flex-1">{c.name}</span>
                  <span className={cn('grid place-items-center w-4 h-4 rounded border shrink-0', on ? 'bg-primary border-primary text-primary-foreground' : 'border-border')}>
                    {on && <Check className="w-3 h-3" />}
                  </span>
                </button>
              );
            })
          )}
          {candidates.length > 0 && (
            <Button size="sm" className="w-full h-8 mt-1" disabled={busy || picked.size === 0} onClick={sendInvites}>
              {t('sendInvites')}
            </Button>
          )}
        </div>
      )}

      <div className="flex items-center gap-1.5 pt-0.5">
        {group.isOwner ? (
          <>
            <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => setAdding((v) => !v)}>
              <UserPlus className="w-3.5 h-3.5" />
              {t('addPeople')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 gap-1.5 ms-auto text-muted-foreground hover:text-destructive"
              disabled={busy}
              onClick={() => run(() => actions.deleteGroup(group.id))}
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t('deleteGroup')}
            </Button>
          </>
        ) : (
          group.members.some((m) => m.id === meId) && (
            <Button size="sm" variant="ghost" className="h-8 gap-1.5 text-muted-foreground hover:text-destructive" disabled={busy} onClick={() => run(() => actions.leaveGroup(group.id))}>
              <LogOut className="w-3.5 h-3.5 rtl:rotate-180" />
              {t('leaveGroup')}
            </Button>
          )
        )}
      </div>
    </div>
  );
};

/** Create and manage groups. Only a group's owner can change it; joining needs an accepted invite. */
const GroupsSheet: React.FC<GroupsSheetProps> = ({ open, onOpenChange, groups, members, meId, actions, onInvited }) => {
  const { t } = useT();
  const [creating, setCreating] = useState(false);

  const create = async () => {
    setCreating(true);
    try {
      await actions.createGroup(t('untitledGroup'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[360px] sm:max-w-[380px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t('groups')}</SheetTitle>
        </SheetHeader>
        <Button className="w-full mt-5 gap-2" onClick={create} disabled={creating}>
          <Plus className="w-4 h-4" />
          {t('newGroup')}
        </Button>
        <div className="mt-4 space-y-3">
          {groups.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">{t('noGroups')}</p>
          ) : (
            groups.map((g) => <GroupCard key={g.id} group={g} members={members} meId={meId} actions={actions} onInvited={onInvited} />)
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default GroupsSheet;
