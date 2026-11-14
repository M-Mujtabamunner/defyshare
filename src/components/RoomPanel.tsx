import React, { useState } from 'react';
import { Check, ChevronRight, Copy, QrCode, Users } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import DeviceName from '@/components/DeviceName';
import { MemberAvatar } from '@/components/MemberPicker';
import { QrTile } from '@/components/ShareLinkDialog';
import type { Member } from '@/hooks/useOnlinePresence';
import { useLocalNetwork } from '@/hooks/useLocalNetwork';
import { useToast } from '@/hooks/use-toast';
import { useT } from '@/lib/i18n';
import { timeAgo } from '@/lib/timeAgo';
import type { Target } from '@/lib/recipients';
import { cn } from '@/lib/utils';

interface RoomPanelProps {
  publicIP: string;
  me: { id: string; name: string };
  onRename: (name: string) => void;
  members: Member[];
  target: Target;
  /** Picks one device as the audience (or everyone when it's picked again). */
  onPickDevice: (member: Member) => void;
  onOpenGroups: () => void;
  groupCount: number;
}

const joinUrl = () => (typeof window === 'undefined' ? 'https://defyshare.app' : window.location.origin);

const RoomBody: React.FC<RoomPanelProps & { showQr?: boolean }> = ({ publicIP, me, onRename, members, target, onPickDevice, onOpenGroups, groupCount, showQr = true }) => {
  const { t } = useT();
  const { toast } = useToast();
  const { networkName } = useLocalNetwork();
  const [copied, setCopied] = useState(false);
  const detecting = publicIP === 'detecting...';
  const picked = new Set(target.kind === 'devices' ? target.devices.map((d) => d.id) : []);

  const copyIP = async () => {
    try {
      await navigator.clipboard.writeText(publicIP);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast({ title: t('ipCopied') });
    } catch {
      toast({ title: t('copyFailed'), variant: 'destructive' });
    }
  };

  const sorted = [...members].sort((a, b) => Number(b.online) - Number(a.online) || b.lastSeen - a.lastSeen);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">{networkName === 'detecting...' ? t('yourNetwork') : networkName}</p>
        <button
          type="button"
          onClick={copyIP}
          disabled={detecting}
          title={t('networkAddress')}
          className="group mt-0.5 inline-flex items-center gap-2 max-w-full text-start text-lg font-medium tabular-nums tracking-tight disabled:text-muted-foreground"
        >
          <span className="truncate">{detecting ? '…' : publicIP}</span>
          {!detecting &&
            (copied ? <Check className="w-4 h-4 text-primary shrink-0" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0" />)}
        </button>
      </div>

      <DeviceName id={me.id} name={me.name} onRename={onRename} />

      {showQr && (
        <div className="flex items-center gap-3 py-3 border-y border-border">
          <QrTile value={joinUrl()} size={64} className="border border-border shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium">{t('addDevice')}</p>
            <p className="mt-0.5 text-xs text-muted-foreground leading-snug">{t('addDeviceHint')}</p>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-medium mb-1.5">{t('devicesHere')}</h3>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground leading-relaxed">{t('noOtherDevices')}</p>
        ) : (
          <ul className="-mx-2 max-h-[16rem] overflow-y-auto">
            {sorted.map((m) => {
              const active = picked.has(m.id);
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => onPickDevice(m)}
                    aria-pressed={active}
                    title={t('sendOnlyTo', { name: m.name })}
                    className={cn(
                      'w-full flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-start transition-colors',
                      active ? 'bg-primary/10' : 'hover:bg-secondary',
                    )}
                  >
                    <MemberAvatar id={m.id} name={m.name} online={m.online} />
                    <span className="flex-1 min-w-0">
                      <span className={cn('block truncate text-sm font-medium', !m.online && 'text-muted-foreground')}>{m.name}</span>
                      {!m.online && m.lastSeen > 0 && (
                        <span className="block text-xs text-muted-foreground">{t('seen', { time: timeAgo(m.lastSeen, t) })}</span>
                      )}
                    </span>
                    {active && <Check className="w-4 h-4 text-primary shrink-0" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <button
        type="button"
        onClick={onOpenGroups}
        className="-mx-2 w-[calc(100%+1rem)] flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm font-medium hover:bg-secondary transition-colors"
      >
        <span className="grid place-items-center w-7 h-7 rounded-full bg-secondary text-muted-foreground">
          <Users className="w-3.5 h-3.5" />
        </span>
        <span className="flex-1 text-start">{t('groups')}</span>
        {groupCount > 0 && <span className="text-xs text-muted-foreground tabular-nums">{groupCount}</span>}
        <ChevronRight className="w-4 h-4 text-muted-foreground rtl:-scale-x-100" />
      </button>

    </div>
  );
};

/** Side panel on wide screens: the network, this device, who's here and a code to join. */
export const RoomPanel: React.FC<RoomPanelProps> = (props) => {
  const { t } = useT();
  return (
    <section aria-label={t('room')} className="rounded-2xl border border-border bg-card p-4">
      <RoomBody {...props} />
    </section>
  );
};

/** Phones and tablets: one line that opens the same details in a sheet, plus the join code. */
export const RoomBar: React.FC<RoomPanelProps & { onlineCount: number }> = ({ onlineCount, ...props }) => {
  const { t } = useT();
  const { networkName } = useLocalNetwork();
  const online = props.members.filter((m) => m.online);

  return (
    <div className="flex items-center gap-2">
      <Sheet>
        <SheetTrigger asChild>
          <button
            type="button"
            className="flex-1 min-w-0 flex items-center gap-2.5 h-12 rounded-full border border-border bg-card ps-2 pe-3 text-start hover:border-foreground/30 transition-colors"
          >
            <span className="flex -space-x-2 rtl:space-x-reverse shrink-0">
              <span className="rounded-full ring-2 ring-card">
                <MemberAvatar id={props.me.id} name={props.me.name} />
              </span>
              {online.slice(0, 3).map((m) => (
                <span key={m.id} className="rounded-full ring-2 ring-card">
                  <MemberAvatar id={m.id} name={m.name} />
                </span>
              ))}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block truncate text-sm font-medium leading-tight">{props.me.name}</span>
              <span className="block truncate text-xs text-muted-foreground leading-tight">
                <span className="tabular-nums">{onlineCount}</span> {t('online')}
                {networkName !== 'detecting...' && `, ${networkName}`}
              </span>
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 rtl:-scale-x-100" />
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[85dvh] overflow-y-auto">
          <SheetHeader className="text-start mb-4">
            <SheetTitle>{t('room')}</SheetTitle>
            <SheetDescription className="sr-only">{t('devicesHere')}</SheetDescription>
          </SheetHeader>
          <RoomBody {...props} showQr={false} />
        </SheetContent>
      </Sheet>

      <Dialog>
        <DialogTrigger asChild>
          <button
            type="button"
            aria-label={t('addDevice')}
            title={t('addDevice')}
            className="grid place-items-center w-12 h-12 rounded-full border border-border bg-card hover:border-foreground/30 transition-colors shrink-0"
          >
            <QrCode className="w-5 h-5" />
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-xs w-[calc(100vw-1.5rem)] rounded-2xl">
          <DialogHeader className="text-start">
            <DialogTitle className="text-base font-medium">{t('addDevice')}</DialogTitle>
            <DialogDescription>{t('addDeviceHint')}</DialogDescription>
          </DialogHeader>
          <div className="grid place-items-center py-2">
            <QrTile value={joinUrl()} size={200} className="border border-border" />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
