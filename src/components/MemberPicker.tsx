import React, { useEffect, useState } from 'react';
import { Check, ChevronRight, Users } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { Member } from '@/hooks/useOnlinePresence';
import type { Group } from '@/hooks/useGroups';
import { EVERYONE, type Peer, type Target } from '@/lib/recipients';
import { avatarColor, initials } from '@/lib/deviceIdentity';
import { useT } from '@/lib/i18n';
import { timeAgo } from '@/lib/timeAgo';
import { cn } from '@/lib/utils';

const AVATAR_SIZE = { xs: 'w-4 h-4 text-[7px]', sm: 'w-5 h-5 text-[9px]', md: 'w-7 h-7 text-[11px]' };

export const MemberAvatar: React.FC<{ id: string; name: string; online?: boolean; size?: 'xs' | 'sm' | 'md' }> = ({
  id,
  name,
  online,
  size = 'md',
}) => (
  <span className="relative inline-flex shrink-0">
    <span
      className={cn('grid place-items-center rounded-full font-semibold text-white', AVATAR_SIZE[size])}
      style={{ background: avatarColor(id) }}
      aria-hidden
    >
      {initials(name)}
    </span>
    {online !== undefined && (
      <span
        className={cn(
          'absolute -bottom-0.5 -end-0.5 rounded-full ring-2 ring-popover',
          size === 'md' ? 'w-2.5 h-2.5' : 'w-2 h-2',
          online ? 'bg-green-500' : 'bg-muted-foreground/50',
        )}
      />
    )}
  </span>
);

/** Compact "who" label: Everyone, a device, several devices, or a group. */
export const TargetLabel: React.FC<{ target: Target; size?: 'xs' | 'sm' }> = ({ target, size = 'sm' }) => {
  const { t } = useT();
  const icon = (
    <span className={cn('grid place-items-center rounded-full bg-secondary text-muted-foreground shrink-0', AVATAR_SIZE[size])}>
      <Users className={size === 'xs' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
    </span>
  );
  if (target.kind === 'everyone') {
    return (
      <>
        {icon}
        <span className="truncate font-medium">{t('everyone')}</span>
      </>
    );
  }
  if (target.kind === 'group') {
    return (
      <>
        <span className={cn('grid place-items-center rounded-full bg-primary/15 text-primary shrink-0', AVATAR_SIZE[size])}>
          <Users className={size === 'xs' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
        </span>
        <span className="truncate font-medium">{target.group.name}</span>
      </>
    );
  }
  const [first, ...rest] = target.devices;
  return (
    <>
      <span className="flex -space-x-1.5 rtl:space-x-reverse shrink-0">
        {target.devices.slice(0, 3).map((d) => (
          <span key={d.id} className="rounded-full ring-2 ring-card">
            <MemberAvatar id={d.id} name={d.name} size={size} />
          </span>
        ))}
      </span>
      <span className="truncate font-medium">{rest.length > 0 ? t('peopleAndMore', { name: first.name, n: rest.length }) : first.name}</span>
    </>
  );
};

interface RecipientPickerProps {
  members: Member[];
  groups: Group[];
  value: Target;
  onChange: (target: Target) => void;
  /** Offered when two or more people are picked. */
  onCreateGroup?: (name: string, people: Peer[]) => Promise<void>;
  onManageGroups?: () => void;
  children: React.ReactNode;
  align?: 'start' | 'center' | 'end';
}

/** Pick who files go to: everyone, a group, or one or more devices. */
const MemberPicker: React.FC<RecipientPickerProps> = ({ members, groups, value, onChange, onCreateGroup, onManageGroups, children, align = 'start' }) => {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [makeGroup, setMakeGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [saving, setSaving] = useState(false);

  const selected = value.kind === 'devices' ? value.devices : [];
  const selectedIds = new Set(selected.map((d) => d.id));

  useEffect(() => {
    if (open) {
      setMakeGroup(false);
      setGroupName(t('untitledGroup'));
    }
  }, [open, t]);

  // People who've gone away still show if they're part of the current selection.
  const people: Member[] = [...members];
  for (const d of selected) if (!people.some((m) => m.id === d.id)) people.push({ ...d, online: false, lastSeen: 0 });
  const online = people.filter((m) => m.online);
  const offline = people.filter((m) => !m.online);

  const toggle = (m: Member) => {
    const next = selectedIds.has(m.id) ? selected.filter((d) => d.id !== m.id) : [...selected, { id: m.id, name: m.name }];
    onChange(next.length > 0 ? { kind: 'devices', devices: next } : EVERYONE);
  };

  const finish = async () => {
    if (makeGroup && selected.length >= 2 && onCreateGroup) {
      setSaving(true);
      try {
        await onCreateGroup(groupName, selected);
      } finally {
        setSaving(false);
      }
    }
    setOpen(false);
  };

  const rowClass = (active: boolean) =>
    cn('w-full flex items-center gap-2.5 rounded-lg px-2 py-2 text-start text-sm transition-colors', active ? 'bg-primary/10' : 'hover:bg-secondary');

  const sectionTitle = (label: string) => <p className="px-2 pt-3 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>;

  const personRow = (m: Member) => {
    const checked = selectedIds.has(m.id);
    return (
      <button key={m.id} type="button" role="checkbox" aria-checked={checked} onClick={() => toggle(m)} className={rowClass(checked)}>
        <MemberAvatar id={m.id} name={m.name} online={m.online} />
        <span className="flex-1 min-w-0">
          <span className="block truncate font-medium">{m.name}</span>
          {!m.online && m.lastSeen > 0 && <span className="block text-[11px] text-muted-foreground">{t('seen', { time: timeAgo(m.lastSeen, t) })}</span>}
        </span>
        <span
          className={cn(
            'grid place-items-center w-5 h-5 rounded-md border shrink-0 transition-colors',
            checked ? 'bg-primary border-primary text-primary-foreground' : 'border-border',
          )}
        >
          {checked && <Check className="w-3.5 h-3.5" />}
        </span>
      </button>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align={align} className="w-80 max-w-[calc(100vw-1.5rem)] p-1.5">
        <div className="max-h-[min(60vh,420px)] overflow-y-auto">
          <button
            type="button"
            onClick={() => {
              onChange(EVERYONE);
              setOpen(false);
            }}
            className={rowClass(value.kind === 'everyone')}
          >
            <span className="grid place-items-center w-7 h-7 rounded-full bg-secondary text-muted-foreground shrink-0">
              <Users className="w-3.5 h-3.5" />
            </span>
            <span className="flex-1 font-medium">{t('everyone')}</span>
            {value.kind === 'everyone' && <Check className="w-4 h-4 text-primary shrink-0" />}
          </button>

          {groups.length > 0 && (
            <>
              {sectionTitle(t('groups'))}
              {groups.map((g) => {
                const active = value.kind === 'group' && value.group.id === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      onChange({ kind: 'group', group: { id: g.id, name: g.name } });
                      setOpen(false);
                    }}
                    className={rowClass(active)}
                  >
                    <span className="grid place-items-center w-7 h-7 rounded-full bg-primary/15 text-primary shrink-0">
                      <Users className="w-3.5 h-3.5" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block truncate font-medium">{g.name}</span>
                      <span className="block text-[11px] text-muted-foreground">{(g.members.length === 1 ? t('oneMember') : t('nMembers', { n: g.members.length }))}</span>
                    </span>
                    {active && <Check className="w-4 h-4 text-primary shrink-0" />}
                  </button>
                );
              })}
            </>
          )}

          {online.length > 0 && (
            <>
              {sectionTitle(t('onlineSection'))}
              {online.map(personRow)}
            </>
          )}
          {offline.length > 0 && (
            <>
              {sectionTitle(t('offlineSection'))}
              {offline.map(personRow)}
            </>
          )}
          {people.length === 0 && <p className="px-2 py-3 text-xs text-muted-foreground">{t('noOtherDevices')}</p>}
        </div>

        {selected.length >= 2 && onCreateGroup && (
          <div className="mt-1.5 border-t border-border/70 px-2 pt-2.5 pb-1 space-y-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <Checkbox checked={makeGroup} onCheckedChange={(c) => setMakeGroup(c === true)} />
              {t('createGroup')}
            </label>
            {makeGroup && (
              <input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                onFocus={(e) => e.target.select()}
                maxLength={32}
                aria-label={t('createGroup')}
                className="w-full h-9 rounded-md border border-input bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 mt-1.5 border-t border-border/70 px-1 pt-1.5">
          {onManageGroups ? (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onManageGroups();
              }}
              className="inline-flex items-center gap-1 px-1.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              {t('manageGroups')}
              <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </button>
          ) : (
            <span />
          )}
          <Button size="sm" className="h-8" onClick={finish} disabled={saving}>
            {selected.length > 0 ? `${t('done')} · ${t('nSelected', { n: selected.length })}` : t('done')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default MemberPicker;
