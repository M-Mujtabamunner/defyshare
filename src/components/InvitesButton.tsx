import React, { useState } from 'react';
import { Mail, Users } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import HeaderButton from '@/components/HeaderButton';
import { MemberAvatar } from '@/components/MemberPicker';
import type { Invite } from '@/hooks/useGroups';
import { useT } from '@/lib/i18n';

interface InvitesButtonProps {
  invites: Invite[];
  onAccept: (invite: Invite) => Promise<void>;
  onDecline: (invite: Invite) => Promise<void>;
}

/** Pending group invitations for this device. */
const InvitesButton: React.FC<InvitesButtonProps> = ({ invites, onAccept, onDecline }) => {
  const { t } = useT();
  const [busy, setBusy] = useState<string | null>(null);

  const act = async (inv: Invite, fn: (i: Invite) => Promise<void>) => {
    setBusy(inv.id);
    try {
      await fn(inv);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <HeaderButton label={t('invitations')} count={invites.length}>
          <Mail className="w-[18px] h-[18px]" />
        </HeaderButton>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 max-w-[calc(100vw-1.5rem)] p-0 overflow-hidden">
        <p className="px-3.5 py-2.5 text-sm font-semibold border-b border-border/70">{t('invitations')}</p>
        <div className="max-h-96 overflow-y-auto">
          {invites.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">{t('noInvitations')}</p>
          ) : (
            invites.map((inv) => (
              <div key={inv.id} className="px-3.5 py-3 border-b border-border/50 last:border-0">
                <div className="flex items-start gap-2.5">
                  <MemberAvatar id={inv.from.id} name={inv.from.name} />
                  <p className="flex-1 min-w-0 text-sm leading-snug">
                    {t('nInvited', { name: inv.from.name, group: inv.groupName })}
                  </p>
                </div>
                <div className="flex gap-2 mt-2.5 ps-9">
                  <Button size="sm" className="h-8 gap-1.5" disabled={busy === inv.id} onClick={() => act(inv, onAccept)}>
                    <Users className="w-3.5 h-3.5" />
                    {t('accept')}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8" disabled={busy === inv.id} onClick={() => act(inv, onDecline)}>
                    {t('decline')}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default InvitesButton;
