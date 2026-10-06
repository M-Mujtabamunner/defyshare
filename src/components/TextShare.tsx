import React, { useState } from 'react';
import { Send, Copy, Check, Trash2, Loader2, ChevronDown, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SharedText } from '@/hooks/useTextSharing';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useT } from '@/lib/i18n';

interface TextShareProps {
  texts: SharedText[];
  loading?: boolean;
  onAdd: (content: string) => Promise<void>;
  onRemove: (textId: string) => void;
  onClearAll: () => void;
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

const TextItem: React.FC<{ text: SharedText; onRemove: (id: string) => void }> = ({ text, onRemove }) => {
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
    <div className="group rounded-lg bg-card border border-border/70 hover:border-primary/40 transition-colors px-3 py-2">
      <div className="flex items-start gap-2">
        <p
          className={cn(
            'flex-1 min-w-0 text-sm whitespace-pre-wrap break-words',
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
        <div className="flex items-center gap-0.5 shrink-0 -mr-1">
          {long && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setExpanded((v) => !v)}
              aria-label={expanded ? t('collapse') : t('expand')}
              aria-expanded={expanded}
              className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
            >
              <ChevronDown className={cn('w-4 h-4 transition-transform', expanded && 'rotate-180')} />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={copy}
            aria-label={t('copy')}
            className="h-7 w-7 text-primary hover:text-primary hover:bg-primary/10"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(text.id)}
            aria-label={t('delete')}
            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-3.5 h-3.5" />
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

      <p className="text-[11px] text-muted-foreground mt-1">{formatTime(text.created_at)}</p>
    </div>
  );
};

const TextShare: React.FC<TextShareProps> = ({ texts, loading, onAdd, onRemove, onClearAll }) => {
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { t } = useT();

  const submit = async () => {
    if (!input.trim() || saving) return;
    setSaving(true);
    try {
      await onAdd(input);
      setInput('');
    } catch (error) {
      toast({
        title: t('textFailed'),
        description: error instanceof Error ? error.message : undefined,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="space-y-2"
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={t('textPlaceholder')}
          className="min-h-[76px] bg-card border-border focus-visible:ring-primary/40 resize-y text-sm"
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={!input.trim() || saving} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Share
          </Button>
        </div>
      </form>

      <div className="space-y-1.5">
        {texts.length > 0 && (
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium text-muted-foreground">{texts.length} shared</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="text-muted-foreground hover:text-destructive h-7 text-xs"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Clear all
            </Button>
          </div>
        )}

        {loading && texts.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            Loading…
          </div>
        ) : texts.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t('noText')}</p>
        ) : (
          texts.map((text) => <TextItem key={text.id} text={text} onRemove={onRemove} />)
        )}
      </div>
    </div>
  );
};

export default TextShare;
