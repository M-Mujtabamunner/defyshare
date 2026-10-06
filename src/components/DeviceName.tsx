import React, { useEffect, useRef, useState } from 'react';
import { Check, Pencil } from 'lucide-react';
import { MemberAvatar } from '@/components/MemberPicker';
import { MAX_NAME_LENGTH } from '@/lib/deviceIdentity';
import { useT } from '@/lib/i18n';

interface DeviceNameProps {
  id: string;
  name: string;
  onRename: (name: string) => void;
}

/** "This device" label with inline rename; the name is saved for this computer. */
const DeviceName: React.FC<DeviceNameProps> = ({ id, name, onRename }) => {
  const { t } = useT();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(name);
  }, [name, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const save = () => {
    if (draft.trim() !== name) onRename(draft);
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-2 min-w-0">
      <MemberAvatar id={id} name={name} size="sm" />
      <span className="text-xs text-muted-foreground shrink-0">{t('thisDevice')}</span>
      {editing ? (
        <form
          className="flex items-center gap-1 min-w-0 flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <input
            ref={inputRef}
            value={draft}
            maxLength={MAX_NAME_LENGTH}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setDraft(name);
                setEditing(false);
              }
            }}
            aria-label={t('deviceName')}
            className="min-w-0 flex-1 h-7 rounded-md border border-input bg-background px-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
          <button type="submit" aria-label={t('saveName')} className="p-1 rounded-md text-primary hover:bg-primary/10" onMouseDown={(e) => e.preventDefault()}>
            <Check className="w-4 h-4" />
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          title={t('renameDevice')}
          className="group flex items-center gap-1.5 min-w-0 rounded-md px-1.5 py-0.5 -mx-1 hover:bg-secondary transition-colors"
        >
          <span className="text-sm font-semibold truncate">{name}</span>
          <Pencil className="w-3 h-3 text-muted-foreground group-hover:text-primary shrink-0" />
        </button>
      )}
    </div>
  );
};

export default DeviceName;
