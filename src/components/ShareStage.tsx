import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ClipboardPaste, FileIcon, FolderUp, Loader2, MessageSquareText, Plus, Send } from 'lucide-react';
import { collectFilesFromDataTransfer } from '@/lib/dropFiles';
import { MemberAvatar } from '@/components/MemberPicker';
import type { Member } from '@/hooks/useOnlinePresence';
import { useToast } from '@/hooks/use-toast';
import { useT } from '@/lib/i18n';
import type { Target } from '@/lib/recipients';
import { cn } from '@/lib/utils';

export type StageTab = 'files' | 'text';

interface ShareStageProps {
  tab: StageTab;
  onTabChange: (tab: StageTab) => void;
  fileCount: number;
  textCount: number;
  /** The "Send to" picker, rendered in the stage's top bar. */
  audience: React.ReactNode;
  /** Other devices in the room that are online right now. */
  devices: Member[];
  /** Upload files; a `target` sends them to that audience instead of the picked one. */
  onFiles: (files: File[], target?: Target) => void;
  onText: (content: string) => Promise<void>;
  isUploading: boolean;
  /** Line under the headline: the size limit and the way to raise it. */
  limitNote: React.ReactNode;
}

const hasFiles = (e: DragEvent | React.DragEvent) => Array.from(e.dataTransfer?.types || []).includes('Files');

/** True while files are being dragged anywhere over the window. */
const useWindowDrag = () => {
  const [dragging, setDragging] = useState(false);
  useEffect(() => {
    let depth = 0;
    const enter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth += 1;
      setDragging(true);
    };
    const leave = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) setDragging(false);
    };
    const end = () => {
      depth = 0;
      setDragging(false);
    };
    window.addEventListener('dragenter', enter);
    window.addEventListener('dragleave', leave);
    window.addEventListener('drop', end);
    window.addEventListener('dragend', end);
    return () => {
      window.removeEventListener('dragenter', enter);
      window.removeEventListener('dragleave', leave);
      window.removeEventListener('drop', end);
      window.removeEventListener('dragend', end);
    };
  }, []);
  return dragging;
};

const TextComposer: React.FC<{ onText: (content: string) => Promise<void> }> = ({ onText }) => {
  const { t } = useT();
  const { toast } = useToast();
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const canPaste = typeof navigator !== 'undefined' && !!navigator.clipboard?.readText;

  const submit = async () => {
    if (!input.trim() || saving) return;
    setSaving(true);
    try {
      await onText(input);
      setInput('');
    } catch (error) {
      toast({ title: t('textFailed'), description: error instanceof Error ? error.message : undefined, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setInput((v) => (v ? `${v}\n${text}` : text));
    } catch {
      toast({ title: t('pasteFailed'), variant: 'destructive' });
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex flex-col flex-1"
    >
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={t('textPlaceholder')}
        aria-label={t('textPlaceholder')}
        className="flex-1 min-h-[7.5rem] w-full resize-none bg-transparent px-5 sm:px-7 pt-1 pb-3 text-lg leading-relaxed placeholder:text-muted-foreground focus:outline-none"
      />
      <div className="flex items-center justify-between gap-2 px-4 sm:px-6 pb-4 sm:pb-5">
        {canPaste ? (
          <button
            type="button"
            onClick={paste}
            className="inline-flex items-center gap-2 h-11 px-4 rounded-full border border-border text-sm font-medium hover:bg-secondary transition-colors"
          >
            <ClipboardPaste className="w-4 h-4" />
            {t('paste')}
          </button>
        ) : (
          <span />
        )}
        <button
          type="submit"
          disabled={!input.trim() || saving}
          className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-foreground text-background text-sm font-medium hover:bg-foreground/85 disabled:opacity-40 transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 rtl:-scale-x-100" />}
          {t('share')}
        </button>
      </div>
    </form>
  );
};

/**
 * The top of the app: pick who it's for, then drop files or type text. While
 * files are dragged over the window it turns dark and each online device
 * becomes its own drop target.
 */
const ShareStage: React.FC<ShareStageProps> = ({ tab, onTabChange, fileCount, textCount, audience, devices, onFiles, onText, isUploading, limitNote }) => {
  const { t } = useT();
  const dragging = useWindowDrag();
  const [over, setOver] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const live = dragging && !isUploading;

  const dropTo = useCallback(
    (target?: Target) => async (e: React.DragEvent) => {
      // A device chip inside the stage may already have taken this drop.
      if (!hasFiles(e) || e.defaultPrevented) return;
      e.preventDefault();
      setOver(null);
      const files = await collectFilesFromDataTransfer(e.dataTransfer);
      if (files.length > 0) onFiles(files, target);
    },
    [onFiles],
  );

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length > 0) onFiles(files);
  };

  const tabButton = (value: StageTab, Icon: typeof FileIcon, label: string, count: number) => (
    <button
      type="button"
      role="tab"
      aria-selected={tab === value}
      onClick={() => onTabChange(value)}
      className={cn(
        'inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-sm font-medium transition-colors',
        tab === value
          ? live
            ? 'bg-background text-foreground'
            : 'bg-foreground text-background'
          : live
            ? 'text-background/70'
            : 'text-muted-foreground hover:text-foreground',
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
      {count > 0 && <span className="tabular-nums opacity-70">{count}</span>}
    </button>
  );

  return (
    <section
      data-upload-zone
      onDragOver={(e) => hasFiles(e) && e.preventDefault()}
      onDrop={dropTo()}
      className={cn(
        'relative flex flex-col rounded-[1.75rem] border transition-colors duration-200',
        live ? 'bg-foreground border-foreground text-background' : 'bg-card border-border',
      )}
    >
      <div className="flex items-center justify-between gap-2 p-3 sm:p-4">
        <div className={cn('flex items-center gap-2 min-w-0', live && 'opacity-0 pointer-events-none')}>
          <span className="hidden min-[400px]:inline text-sm text-muted-foreground shrink-0 ps-1.5">{t('sendTo')}</span>
          {audience}
        </div>
        <div role="tablist" className={cn('flex items-center gap-0.5 p-0.5 rounded-full shrink-0', live ? 'bg-background/10' : 'bg-secondary')}>
          {tabButton('files', FileIcon, t('files'), fileCount)}
          {tabButton('text', MessageSquareText, t('text'), textCount)}
        </div>
      </div>

      {tab === 'text' && !live ? (
        <TextComposer onText={onText} />
      ) : (
        <div className="flex flex-col flex-1 px-5 sm:px-7 pb-5 sm:pb-7 pt-3 sm:pt-6">
          <h2 className="text-[1.75rem] sm:text-[2.25rem] leading-[1.1] font-medium tracking-tight text-balance">
            {isUploading ? t('uploading') : live ? t('releaseToUpload') : t('dropHere')}
          </h2>
          <p className={cn('mt-2 text-[15px] leading-relaxed', live ? 'text-background/70' : 'text-muted-foreground')}>{t('dropHint')}</p>

          <div className={cn('mt-5 sm:mt-7 flex flex-wrap items-center gap-2', live && 'hidden')}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-foreground text-background text-[15px] font-medium hover:bg-foreground/85 disabled:opacity-50 transition-colors"
            >
              {isUploading ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : <Plus className="w-[18px] h-[18px]" />}
              {t('chooseFiles')}
            </button>
            <button
              type="button"
              onClick={() => folderInputRef.current?.click()}
              disabled={isUploading}
              className="inline-flex items-center gap-2 h-12 px-5 rounded-full border border-border text-[15px] font-medium hover:bg-secondary disabled:opacity-50 transition-colors"
            >
              <FolderUp className="w-[18px] h-[18px]" />
              {t('folderBtn')}
            </button>
            <p className="basis-full sm:basis-auto sm:ms-2 text-sm text-muted-foreground">{limitNote}</p>
          </div>

          {/* Each online device is its own target while dragging. */}
          {live && devices.length > 0 && (
            <div className="mt-6">
              <p className="text-sm text-background/70 mb-2.5">{t('dropOnDevice')}</p>
              <div className="flex flex-wrap gap-2">
                {devices.map((m) => (
                  <div
                    key={m.id}
                    onDragEnter={() => setOver(m.id)}
                    onDragOver={(e) => {
                      if (!hasFiles(e)) return;
                      e.preventDefault();
                      if (over !== m.id) setOver(m.id);
                    }}
                    onDragLeave={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver((cur) => (cur === m.id ? null : cur));
                    }}
                    onDrop={dropTo({ kind: 'devices', devices: [{ id: m.id, name: m.name }] })}
                    className={cn(
                      'flex items-center gap-2.5 h-14 ps-3 pe-5 rounded-full border-2 border-dashed text-[15px] font-medium transition-colors',
                      over === m.id ? 'bg-primary border-primary text-primary-foreground' : 'border-background/35',
                    )}
                  >
                    <MemberAvatar id={m.id} name={m.name} />
                    <span className="truncate max-w-[10rem]">{m.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <input ref={fileInputRef} type="file" multiple onChange={onPick} className="hidden" disabled={isUploading} aria-label={t('chooseFiles')} />
      <input
        ref={folderInputRef}
        type="file"
        // @ts-expect-error non-standard but widely supported
        webkitdirectory=""
        directory=""
        multiple
        onChange={onPick}
        className="hidden"
        disabled={isUploading}
        aria-label={t('folderBtn')}
      />
    </section>
  );
};

export default ShareStage;
