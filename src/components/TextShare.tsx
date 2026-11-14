import React, { useState } from 'react';
import { Copy, Check, Trash2, Loader2, ChevronDown, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SharedText } from '@/hooks/useTextSharing';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useT } from '@/lib/i18n';
import { MemberAvatar, TargetLabel } from '@/components/MemberPicker';

interface TextShareProps {
  texts: SharedText[];
  loading?: boolean;
  onRemove: (textId: string) => void;
  onClearAll: () => void;
  deviceId: string;
}

const URL_RE = /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+)/gi;
const TRAILING_PUNCT = /[).,;:!?\]]+$/;

const toHref = (raw: string) => (raw.startsWith('www.') ? `https://${raw}` : raw);

/** Split text into plain strings and URL tokens (trailing punctuation stays as text). */
const tokenize = (content: string) => {
  const parts: { text: string; url?: string }[] = [];
  let last = 0;
  for (const m of content.matchAll(URL_RE)) {
    const start = m.index ?? 0;
    const trail = m[0].match(TRAILING_PUNCT)?.[0] ?? '';
    const url = trail ? m[0].slice(0, -trail.length) : m[0];
    if (start > last) parts.push({ text: content.slice(last, start) });
    parts.push({ text: url, url: toHref(url) });
    last = start + url.length;
  }
  if (last < content.length) parts.push({ text: content.slice(last) });
  return parts;
};

const shortUrl = (href: string) => {
  try {
    const u = new URL(href);
    const path = u.pathname === '/' ? '' : u.pathname;
    const label = u.hostname.replace(/^www\./, '') + path;
    return label.length > 42 ? label.slice(0, 40) + '…' : label;
  } catch {
    return href;
  }
};

const formatTime = (timestamp: string) =>
  new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const isLong = (content: string) => content.length > 220 || content.split('\n').length > 3;

const TextItem: React.FC<{ text: SharedText; deviceId: string; onRemove: (id: string) => void }> = ({ text, deviceId, onRemove }) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { t } = useT();
  const parts = tokenize(text.content);
  const links = [...new Set(parts.filter((p) => p.url).map((p) => p.url as string))];
  const long = isLong(text.content);

  const copy = async () => {
    await navigator.clipboard.writeText(text.content);
    setCopied(true);
    toast({ title: t('copied') });
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <li className="group ps-4 pe-2.5 py-3">
      <div className="flex items-start gap-2">
        <p
          className={cn(
            'flex-1 min-w-0 pt-1 text-[15px] leading-relaxed whitespace-pre-wrap break-words',
            long && !expanded && 'line-clamp-3',
          )}
        >
          {parts.map((p, i) =>
            p.url ? (
              <a
                key={i}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-link bg-link-bg rounded px-1 hover:underline break-all"
              >
                {p.text}
              </a>
            ) : (
              <React.Fragment key={i}>{p.text}</React.Fragment>
            ),
          )}
        </p>
        <div className="flex items-center shrink-0">
          {long && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setExpanded((v) => !v)}
              aria-label={expanded ? t('collapse') : t('expand')}
              aria-expanded={expanded}
              className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              <ChevronDown className={cn('w-4 h-4 transition-transform', expanded && 'rotate-180')} />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={copy}
            aria-label={t('copy')}
            className="h-9 w-9 rounded-full text-foreground hover:bg-foreground hover:text-background"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(text.id)}
            aria-label={t('delete')}
            className="h-9 w-9 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {links.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {links.map((href) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              title={href}
              className="inline-flex items-center gap-1 max-w-full text-xs font-medium text-link bg-link-bg hover:underline px-2 py-0.5 rounded-md"
            >
              <ExternalLink className="w-3 h-3 shrink-0" />
              <span className="truncate">{shortUrl(href)}</span>
            </a>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 min-w-0 text-xs text-muted-foreground mt-1.5">
        <span className="shrink-0">{formatTime(text.created_at)}</span>
        {text.from?.id === deviceId ? (
          <span className="inline-flex items-center gap-1 min-w-0">
            <span className="shrink-0">{t('to')}</span>
            <span className="inline-flex items-center gap-1 min-w-0 text-foreground">
              <TargetLabel target={text.target} size="xs" />
            </span>
          </span>
        ) : (
          text.from && (
            <span className="inline-flex items-center gap-1 min-w-0">
              <span className="shrink-0">{t('from')}</span>
              <MemberAvatar id={text.from.id} name={text.from.name} size="xs" />
              <span className="truncate font-medium text-foreground">{text.from.name}</span>
              {text.target.kind !== 'everyone' && (
                <span className="shrink-0 text-primary truncate">
                  ({text.target.kind === 'group' ? text.target.group.name : t('toYou')})
                </span>
              )}
            </span>
          )
        )}
      </div>
    </li>
  );
};

const TextShare: React.FC<TextShareProps> = ({ texts, loading, onRemove, onClearAll, deviceId }) => {
  const { t } = useT();

  if (loading && texts.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        {t('loading')}
      </div>
    );
  }

  if (texts.length === 0) {
    return <p className="py-12 text-center text-[15px] font-medium">{t('noText')}</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 min-h-9">
        <h2 className="text-sm text-muted-foreground">{t('nShared', { n: texts.length })}</h2>
        <button
          type="button"
          onClick={onClearAll}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          {t('clearAll')}
        </button>
      </div>
      <ul className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
        {texts.map((text) => (
          <TextItem key={text.id} text={text} deviceId={deviceId} onRemove={onRemove} />
        ))}
      </ul>
    </div>
  );
};

export default TextShare;
