import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MemberAvatar } from '@/components/MemberPicker';
import { MAX_NAME_LENGTH, isCustomName } from '@/lib/deviceIdentity';

const ASKED_KEY = 'defyshare:name-asked';

const alreadyAsked = () => {
  try {
    return localStorage.getItem(ASKED_KEY) === '1' || isCustomName();
  } catch {
    return true; // storage blocked: don't nag
  }
};

/** First visit: ask for a name so other devices know who's sending. Asked once per browser. */
const NamePrompt: React.FC<{ id: string; name: string; onRename: (name: string) => void }> = ({ id, name, onRename }) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (alreadyAsked()) return;
    const timer = setTimeout(() => setOpen(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const close = (save: boolean) => {
    if (save && draft.trim()) onRename(draft);
    try {
      localStorage.setItem(ASKED_KEY, '1');
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close(false)}>
      <DialogContent
        className="max-w-sm"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          inputRef.current?.focus();
        }}
      >
        <DialogHeader className="items-center text-center sm:text-center">
          <MemberAvatar id={id} name={draft.trim() || name} />
          <DialogTitle className="pt-1">What's your name?</DialogTitle>
          <DialogDescription>Other devices will see this when you send them files.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            close(true);
          }}
          className="space-y-3"
        >
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={MAX_NAME_LENGTH}
            placeholder={name}
            autoComplete="name"
            className="w-full h-11 rounded-full border border-input bg-background px-4 text-center focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
          <Button type="submit" className="w-full h-11 rounded-full" disabled={!draft.trim()}>
            Save
          </Button>
          <button type="button" onClick={() => close(false)} className="block mx-auto text-xs text-muted-foreground hover:text-foreground">
            Keep "{name}"
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NamePrompt;
