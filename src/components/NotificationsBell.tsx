import React, { useEffect, useState } from 'react';
import { Bell, FileDown, UserPlus, UserCheck, UserMinus, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import HeaderButton from '@/components/HeaderButton';
import type { AppNotification, NotificationKind } from '@/hooks/useNotifications';
import { useT } from '@/lib/i18n';
import { timeAgo } from '@/lib/timeAgo';
import { cn } from '@/lib/utils';

const ICONS: Record<NotificationKind, typeof Bell> = {
  file: FileDown,
  invite: UserPlus,
  joined: UserCheck,
  removed: UserMinus,
};

const NotificationIcon: React.FC<{ kind: NotificationKind }> = ({ kind }) => {
  const Icon = ICONS[kind];
  return (
    <span className="grid place-items-center w-8 h-8 rounded-full bg-primary/10 text-primary shrink-0">
      <Icon className="w-4 h-4" />
    </span>
  );
};

interface BellProps {
  items: AppNotification[];
  unread: number;
  onOpen: () => void;
  onClear: () => void;
}

export const NotificationsBell: React.FC<BellProps> = ({ items, unread, onOpen, onClear }) => {
  const { t } = useT();
  const [open, setOpen] = useState(false);

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) onOpen();
      }}
    >
      <PopoverTrigger asChild>
        <HeaderButton label={t('notifications')} count={unread}>
          <Bell className="w-[18px] h-[18px]" />
        </HeaderButton>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 max-w-[calc(100vw-1.5rem)] p-0 overflow-hidden">
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border/70">
          <p className="text-sm font-semibold">{t('notifications')}</p>
          {items.length > 0 && (
            <button type="button" onClick={onClear} className="text-xs text-muted-foreground hover:text-foreground">
              {t('clear')}
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">{t('noNotifications')}</p>
          ) : (
            items.map((n) => (
              <div key={n.id} className={cn('flex items-start gap-3 px-3.5 py-2.5', !n.read && 'bg-primary/5')}>
                <NotificationIcon kind={n.kind} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-snug break-words">{n.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{timeAgo(n.at, t)}</p>
                </div>
                {!n.read && <span className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" />}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

/** Desktop-only cards that slide in from the bottom-left for new notifications. */
export const NotificationStack: React.FC<{ items: AppNotification[]; onDismiss: (id: string) => void }> = ({ items, onDismiss }) => {
  const { t } = useT();
  return (
    <div
      className="fixed left-3 z-[60] flex flex-col-reverse gap-2 w-[320px] pointer-events-none"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 44px)' }}
      aria-live="polite"
    >
      {items.map((n) => (
        <StackCard key={n.id} item={n} onDismiss={onDismiss} closeLabel={t('dismiss')} />
      ))}
    </div>
  );
};

const StackCard: React.FC<{ item: AppNotification; onDismiss: (id: string) => void; closeLabel: string }> = ({ item, onDismiss, closeLabel }) => {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(item.id), 6000);
    return () => clearTimeout(timer);
  }, [item.id, onDismiss]);

  return (
    <div className="pointer-events-auto flex items-start gap-3 rounded-xl border border-border bg-popover text-popover-foreground shadow-xl px-3.5 py-3 animate-in slide-in-from-left-full fade-in-0 duration-300">
      <NotificationIcon kind={item.kind} />
      <p className="flex-1 min-w-0 text-sm leading-snug pt-1 break-words">{item.title}</p>
      <button type="button" onClick={() => onDismiss(item.id)} aria-label={closeLabel} className="p-1 -m-1 text-muted-foreground hover:text-foreground">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
