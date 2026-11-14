import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownUp,
  Check,
  ChevronDown,
  Clock,
  Download,
  ExternalLink,
  LayoutGrid,
  Link2,
  List,
  Loader2,
  MoreHorizontal,
  QrCode,
  Search,
  Send,
  SquareCheck,
  Trash2,
  X,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SharedFile, senderOf, targetOf } from '@/hooks/useFileSharing';
import type { Member } from '@/hooks/useOnlinePresence';
import type { Group } from '@/hooks/useGroups';
import MemberPicker, { MemberAvatar, TargetLabel } from '@/components/MemberPicker';
import type { Peer, Target } from '@/lib/recipients';
import { getSignedFileUrl } from '@/lib/storageUrls';
import { extensionOf } from '@/lib/fileTypes';
import { formatFileSize, isPreviewable, KIND_ICON, KIND_LABEL, KIND_ORDER, kindOf, splitPath, timeLeft, type FileKind } from '@/lib/fileKinds';
import { useT } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FileListProps {
  files: SharedFile[];
  loading?: boolean;
  deviceId: string;
  members: Member[];
  groups: Group[];
  onDownload: (file: SharedFile) => void;
  onRemove: (fileId: string) => void;
  /** Opens the viewer for a file; `visible` is the list as currently filtered and sorted. */
  onPreview?: (file: SharedFile, visible: SharedFile[]) => void;
  onShare?: (file: SharedFile) => void;
  onChangeTarget: (file: SharedFile, target: Target) => void;
  onCreateGroup: (name: string, people: Peer[]) => Promise<void>;
  onManageGroups: () => void;
}

type PartyProps = Pick<FileListProps, 'deviceId' | 'members' | 'groups' | 'onChangeTarget' | 'onCreateGroup' | 'onManageGroups'> & {
  file: SharedFile;
};

type SortKey = 'newest' | 'name' | 'size';
type View = 'list' | 'grid';

const VIEW_KEY = 'defyshare:file-view';
const SORT_KEY = 'defyshare:file-sort';

const readPref = <T extends string>(key: string, allowed: readonly T[], fallback: T): T => {
  try {
    const v = localStorage.getItem(key) as T | null;
    return v && allowed.includes(v) ? v : fallback;
  } catch {
    return fallback;
  }
};

const writePref = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage blocked */
  }
};

/** Who a file is to/from. The sender can change who it's for from here. */
const FileParty: React.FC<PartyProps> = ({ file, deviceId, members, groups, onChangeTarget, onCreateGroup, onManageGroups }) => {
  const { t } = useT();
  const target = targetOf(file);
  const from = senderOf(file);

  if (from?.id === deviceId) {
    return (
      <span onClick={(e) => e.stopPropagation()} className="inline-flex max-w-full">
        <MemberPicker
          members={members}
          groups={groups}
          value={target}
          onChange={(next) => onChangeTarget(file, next)}
          onCreateGroup={onCreateGroup}
          onManageGroups={onManageGroups}
        >
          <button
            type="button"
            title={t('changeWho')}
            className="inline-flex items-center gap-1 max-w-full rounded-full text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Send className="w-3 h-3 shrink-0 rtl:-scale-x-100" />
            <span className="shrink-0">{t('to')}</span>
            <span className="inline-flex items-center gap-1 min-w-0 text-foreground">
              <TargetLabel target={target} size="xs" />
            </span>
            <ChevronDown className="w-3 h-3 shrink-0" />
          </button>
        </MemberPicker>
      </span>
    );
  }

  if (!from) return null;
  const forMe = target.kind === 'devices' ? t('toYou') : target.kind === 'group' ? target.group.name : null;
  return (
    <span className="inline-flex items-center gap-1 max-w-full text-xs text-muted-foreground">
      <span className="shrink-0">{t('from')}</span>
      <MemberAvatar id={from.id} name={from.name} size="xs" />
      <span className="truncate font-medium text-foreground">{from.name}</span>
      {forMe && <span className="shrink-0 truncate text-primary">({forMe})</span>}
    </span>
  );
};

const useSignedUrl = (filePath: string) => {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    getSignedFileUrl(filePath).then((u) => active && setUrl(u));
    return () => {
      active = false;
    };
  }, [filePath]);
  return url;
};

/** Re-renders on a slow tick so "time left" stays current. */
const useNow = (everyMs = 30000) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), everyMs);
    return () => clearInterval(id);
  }, [everyMs]);
  return now;
};

/** Thumbnail for images, otherwise the kind's icon with the file extension. */
const FileThumb: React.FC<{ file: SharedFile; url: string | null; large?: boolean }> = ({ file, url, large }) => {
  const [failed, setFailed] = useState(false);
  const kind = kindOf(file);
  const Icon = KIND_ICON[kind];
  const ext = extensionOf(file.name);

  if (kind === 'image' && url && !failed) {
    return (
      <img
        src={url}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className={cn('object-cover bg-secondary', large ? 'w-full h-full' : 'w-10 h-10 rounded-lg shrink-0')}
      />
    );
  }
  if (large) {
    return (
      <div className="w-full h-full grid place-items-center bg-secondary/70 text-muted-foreground">
        <div className="flex flex-col items-center gap-1.5">
          <Icon className="w-7 h-7" strokeWidth={1.5} />
          {ext && <span className="text-[11px] font-medium">.{ext}</span>}
        </div>
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-lg bg-secondary text-muted-foreground grid place-items-center shrink-0">
      <Icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
    </div>
  );
};

type ItemProps = Omit<FileListProps, 'files' | 'loading' | 'onPreview'> & {
  file: SharedFile;
  now: number;
  selecting: boolean;
  selected: boolean;
  onToggle: () => void;
  onOpen?: () => void;
};

const SelectBox: React.FC<{ checked: boolean; className?: string }> = ({ checked, className }) => (
  <span
    aria-hidden
    className={cn(
      'grid place-items-center w-5 h-5 rounded-md border shrink-0 transition-colors',
      checked ? 'bg-foreground border-foreground text-background' : 'border-input bg-card',
      className,
    )}
  >
    {checked && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
  </span>
);

/** Per-file actions that don't need a permanent button. */
const FileMenu: React.FC<{ file: SharedFile; url: string | null; onShare?: (f: SharedFile) => void; onRemove: (id: string) => void; className?: string }> = ({
  file,
  url,
  onShare,
  onRemove,
  className,
}) => {
  const { t } = useT();
  const { toast } = useToast();

  const copyLink = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: t('linkCopied') });
    } catch {
      toast({ title: t('copyFailed'), variant: 'destructive' });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`${file.name}: ${t('open')}, ${t('shareLink')}, ${t('delete')}`}
          className={cn(
            'grid place-items-center w-9 h-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors',
            className,
          )}
        >
          <MoreHorizontal className="w-[18px] h-[18px]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {url && (
          <DropdownMenuItem asChild>
            <a href={url} target="_blank" rel="noopener noreferrer" className="gap-2">
              <ExternalLink className="w-4 h-4" />
              {t('open')}
            </a>
          </DropdownMenuItem>
        )}
        {onShare && (
          <DropdownMenuItem onSelect={() => onShare(file)} className="gap-2">
            <QrCode className="w-4 h-4" />
            {t('shareLink')}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={copyLink} disabled={!url} className="gap-2">
          <Link2 className="w-4 h-4" />
          {t('copyLink')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onRemove(file.id)} className="gap-2 text-destructive focus:text-destructive">
          <Trash2 className="w-4 h-4" />
          {t('delete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const Expiry: React.FC<{ expiresAt: string; now: number }> = ({ expiresAt, now }) => {
  const { t } = useT();
  const left = timeLeft(expiresAt, now);
  return (
    <span
      title={t('deletedIn', { time: left.label })}
      className={cn('inline-flex items-center gap-1 tabular-nums shrink-0', left.soon && 'text-destructive font-medium')}
    >
      <Clock className="w-3 h-3" />
      {left.label}
    </span>
  );
};

const FileRow: React.FC<ItemProps> = ({ file, now, selecting, selected, onToggle, onOpen, onDownload, onRemove, onShare, ...party }) => {
  const { t } = useT();
  const url = useSignedUrl(file.file_path);
  const { dir, base } = splitPath(file.name);
  const clickable = selecting || !!onOpen;

  return (
    <li
      className={cn(
        'group flex items-center gap-3 ps-3 pe-1.5 sm:ps-4 sm:pe-2.5 py-2.5 transition-colors',
        clickable && 'cursor-pointer',
        selected ? 'bg-primary/[0.07]' : 'hover:bg-secondary/50',
      )}
      onClick={() => (selecting ? onToggle() : onOpen?.())}
    >
      {selecting && <SelectBox checked={selected} />}
      <FileThumb file={file} url={url} />

      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium truncate leading-snug" title={file.name}>
          {base}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5 min-w-0">
          <span className="tabular-nums shrink-0">{formatFileSize(file.size)}</span>
          <Expiry expiresAt={file.expires_at} now={now} />
          {dir && <span className="hidden sm:inline truncate max-w-[12rem]">{dir}/</span>}
          <FileParty file={file} {...party} />
        </div>
      </div>

      {!selecting && (
        <div className="flex items-center shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onDownload(file)}
            title={t('download')}
            aria-label={`${t('download')} ${base}`}
            className="grid place-items-center w-9 h-9 rounded-full text-foreground hover:bg-foreground hover:text-background transition-colors"
          >
            <Download className="w-[18px] h-[18px]" />
          </button>
          <FileMenu file={file} url={url} onShare={onShare} onRemove={onRemove} />
        </div>
      )}
    </li>
  );
};

const FileCard: React.FC<ItemProps> = ({ file, now, selecting, selected, onToggle, onOpen, onDownload, onRemove, onShare }) => {
  const { t } = useT();
  const url = useSignedUrl(file.file_path);
  const { base } = splitPath(file.name);

  return (
    <li
      className={cn(
        'group relative flex flex-col rounded-xl border bg-card overflow-hidden transition-colors',
        (selecting || onOpen) && 'cursor-pointer',
        selected ? 'border-foreground' : 'border-border hover:border-foreground/30',
      )}
      onClick={() => (selecting ? onToggle() : onOpen?.())}
    >
      <div className="relative aspect-[4/3]">
        <FileThumb file={file} url={url} large />
        {selecting && <SelectBox checked={selected} className="absolute top-2 start-2" />}
      </div>
      <div className="flex items-center gap-1 ps-3 pe-1 py-1.5 border-t border-border">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" title={file.name}>
            {base}
          </p>
          <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
            <span className="tabular-nums">{formatFileSize(file.size)}</span>
            <Expiry expiresAt={file.expires_at} now={now} />
          </div>
        </div>
        {!selecting && (
          <div className="flex items-center shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => onDownload(file)}
              title={t('download')}
              aria-label={`${t('download')} ${base}`}
              className="grid place-items-center w-8 h-8 rounded-full text-foreground hover:bg-foreground hover:text-background transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
            <FileMenu file={file} url={url} onShare={onShare} onRemove={onRemove} className="w-8 h-8" />
          </div>
        )}
      </div>
    </li>
  );
};

const toolButton = (active = false) =>
  cn(
    'inline-flex items-center justify-center gap-1.5 h-9 min-w-9 px-2.5 rounded-full text-sm font-medium transition-colors shrink-0',
    active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
  );

const FileList: React.FC<FileListProps> = ({ files, loading, onPreview, ...itemProps }) => {
  const { t } = useT();
  const now = useNow();
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<FileKind | 'all'>('all');
  const [sort, setSort] = useState<SortKey>(() => readPref(SORT_KEY, ['newest', 'name', 'size'] as const, 'newest'));
  const [view, setView] = useState<View>(() => readPref(VIEW_KEY, ['list', 'grid'] as const, 'list'));
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const kinds = useMemo(() => {
    const present = new Set(files.map(kindOf));
    return KIND_ORDER.filter((k) => present.has(k));
  }, [files]);

  // A filter whose files are all gone falls back to everything.
  useEffect(() => {
    if (kind !== 'all' && !kinds.includes(kind)) setKind('all');
  }, [kind, kinds]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = files.filter((f) => (kind === 'all' || kindOf(f) === kind) && (!q || f.name.toLowerCase().includes(q)));
    if (sort === 'name') return [...list].sort((a, b) => splitPath(a.name).base.localeCompare(splitPath(b.name).base, undefined, { numeric: true }));
    if (sort === 'size') return [...list].sort((a, b) => b.size - a.size);
    return [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [files, kind, query, sort]);

  // Drop selections for files that have gone.
  useEffect(() => {
    setSelected((prev) => {
      const ids = new Set(files.map((f) => f.id));
      const next = new Set([...prev].filter((id) => ids.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [files]);

  const stopSelecting = () => {
    setSelecting(false);
    setSelected(new Set());
  };

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const chosen = visible.filter((f) => selected.has(f.id));
  const allChosen = visible.length > 0 && chosen.length === visible.length;

  const downloadChosen = async () => {
    for (const f of chosen) {
      itemProps.onDownload(f);
      await new Promise((r) => setTimeout(r, 350));
    }
    stopSelecting();
  };

  const deleteChosen = () => {
    chosen.forEach((f) => itemProps.onRemove(f.id));
    stopSelecting();
  };

  if (loading && files.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        {t('loadingFiles')}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-[15px] font-medium">{t('noFiles')}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t('emptyHint')}</p>
      </div>
    );
  }

  const Item = view === 'grid' ? FileCard : FileRow;
  const showTools = files.length > 1;

  return (
    <div className="space-y-3">
      {showTools &&
        (selecting ? (
          <div className="flex items-center gap-1 h-11 rounded-full bg-foreground text-background ps-4 pe-1.5">
            <span className="text-sm font-medium tabular-nums me-auto truncate">{t('nSelected', { n: chosen.length })}</span>
            <button
              type="button"
              onClick={() => setSelected(allChosen ? new Set() : new Set(visible.map((f) => f.id)))}
              className="h-8 px-3 rounded-full text-sm font-medium hover:bg-background/15 transition-colors"
            >
              {t('selectAll')}
            </button>
            <button
              type="button"
              onClick={downloadChosen}
              disabled={chosen.length === 0}
              aria-label={t('download')}
              title={t('download')}
              className="grid place-items-center w-8 h-8 rounded-full hover:bg-background/15 disabled:opacity-40 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={deleteChosen}
              disabled={chosen.length === 0}
              aria-label={t('delete')}
              title={t('delete')}
              className="grid place-items-center w-8 h-8 rounded-full hover:bg-background/15 disabled:opacity-40 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={stopSelecting}
              aria-label={t('cancel')}
              title={t('cancel')}
              className="grid place-items-center w-8 h-8 rounded-full hover:bg-background/15 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <label className="relative flex-1 min-w-0">
              <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('searchFiles')}
                aria-label={t('searchFiles')}
                className="w-full h-11 rounded-full border border-border bg-card ps-10 pe-4 text-[15px] placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40 transition-colors [&::-webkit-search-cancel-button]:hidden"
              />
            </label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" aria-label={t('sortBy')} title={t('sortBy')} className={toolButton()}>
                  <ArrowDownUp className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuRadioGroup
                  value={sort}
                  onValueChange={(v) => {
                    setSort(v as SortKey);
                    writePref(SORT_KEY, v);
                  }}
                >
                  <DropdownMenuRadioItem value="newest">{t('sortNewest')}</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="name">{t('sortName')}</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="size">{t('sortSize')}</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              type="button"
              onClick={() => {
                const next = view === 'list' ? 'grid' : 'list';
                setView(next);
                writePref(VIEW_KEY, next);
              }}
              aria-label={view === 'list' ? t('viewGrid') : t('viewList')}
              title={view === 'list' ? t('viewGrid') : t('viewList')}
              className={toolButton()}
            >
              {view === 'list' ? <LayoutGrid className="w-4 h-4" /> : <List className="w-4 h-4" />}
            </button>
            <button type="button" onClick={() => setSelecting(true)} aria-label={t('selectFiles')} title={t('selectFiles')} className={toolButton()}>
              <SquareCheck className="w-4 h-4" />
            </button>
          </div>
        ))}

      {showTools && kinds.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label={t('files')}>
          {(['all', ...kinds] as const).map((k) => {
            const count = k === 'all' ? files.length : files.filter((f) => kindOf(f) === k).length;
            const active = kind === k;
            return (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setKind(k)}
                className={cn(
                  'inline-flex items-center gap-1.5 h-8 px-3 rounded-full border text-sm font-medium whitespace-nowrap transition-colors',
                  active ? 'bg-foreground border-foreground text-background' : 'border-border bg-card text-muted-foreground hover:text-foreground',
                )}
              >
                {k === 'all' ? t('filterAll') : t(KIND_LABEL[k])}
                <span className={cn('tabular-nums text-xs', active ? 'opacity-70' : 'opacity-60')}>{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {visible.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-[15px] font-medium">{t('noMatches')}</p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setKind('all');
            }}
            className="mt-2 text-sm font-medium text-primary hover:underline"
          >
            {t('clearSearch')}
          </button>
        </div>
      ) : (
        <ul
          className={
            view === 'grid'
              ? 'grid grid-cols-2 sm:grid-cols-3 gap-3'
              : 'rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden'
          }
        >
          {visible.map((file) => (
            <Item
              key={file.id}
              file={file}
              now={now}
              selecting={selecting}
              selected={selected.has(file.id)}
              onToggle={() => toggle(file.id)}
              onOpen={onPreview && isPreviewable(file.type || '') ? () => onPreview(file, visible) : undefined}
              {...itemProps}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

export default FileList;
