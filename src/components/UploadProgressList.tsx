import React from 'react';
import { CheckCircle2, AlertCircle, Loader2, Clock, X, RotateCw, Ban } from 'lucide-react';
import type { PerFileProgress } from '@/hooks/useFileSharing';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';

interface Props {
  items: PerFileProgress[];
  aggregate: number;
  totalFiles: number;
  completedFiles: number;
  onCancel?: (id: string) => void;
  onRetry?: (id: string) => void;
  onDismiss?: () => void;
}

const formatBytes = (n: number) => {
  if (n === 0) return '0 B';
  const k = 1024;
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(n) / Math.log(k)));
  return `${(n / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
};

const statusBadge = (s: PerFileProgress['status']) => {
  if (s === 'done') return <CheckCircle2 className="w-4 h-4 text-primary" />;
  if (s === 'error') return <AlertCircle className="w-4 h-4 text-destructive" />;
  if (s === 'canceled') return <Ban className="w-4 h-4 text-muted-foreground" />;
  if (s === 'uploading') return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
  return <Clock className="w-4 h-4 text-muted-foreground" />;
};

const UploadProgressList: React.FC<Props> = ({
  items,
  aggregate,
  totalFiles,
  completedFiles,
  onCancel,
  onRetry,
  onDismiss,
}) => {
  const { t } = useT();
  if (items.length === 0) return null;
  return (
    <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm p-3 sm:p-4 space-y-3 animate-fade-in">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium">
            {completedFiles >= totalFiles ? t('uploadedTitle') : t('uploadingTitle')}{' '}
            <span className="text-primary">{completedFiles}/{totalFiles}</span>
          </p>
          <p className="text-xs text-muted-foreground">{t('percentComplete', { n: Math.round(aggregate) })}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-muted-foreground hover:text-foreground p-1 rounded"
            aria-label={t('dismiss')}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-300"
          style={{ width: `${aggregate}%` }}
        />
      </div>
      <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
        {items.map((it) => {
          const pct = it.size > 0 ? Math.min(100, Math.round((it.loaded / it.size) * 100)) : 0;
          const canCancel = it.status === 'queued' || it.status === 'uploading';
          const canRetry = it.status === 'error' || it.status === 'canceled';
          return (
            <div
              key={it.id}
              className={cn(
                'group flex items-center gap-2 p-2 rounded-lg bg-secondary/40 border border-border/40',
                it.status === 'error' && 'border-destructive/40 bg-destructive/5',
                it.status === 'canceled' && 'opacity-70',
              )}
            >
              <div className="shrink-0">{statusBadge(it.status)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate font-mono">{it.name}</span>
                  <span className="text-muted-foreground shrink-0">
                    {it.status === 'error'
                      ? t('failed')
                      : it.status === 'canceled'
                        ? t('canceled')
                        : it.status === 'done'
                          ? formatBytes(it.size)
                          : `${formatBytes(it.loaded)} / ${formatBytes(it.size)}`}
                  </span>
                </div>
                <div className="mt-1 h-1 bg-background/60 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-200',
                      it.status === 'error' && 'bg-destructive',
                      it.status === 'canceled' && 'bg-muted-foreground',
                      it.status !== 'error' && it.status !== 'canceled' && 'bg-primary',
                    )}
                    style={{ width: `${it.status === 'done' ? 100 : pct}%` }}
                  />
                </div>
                {(it.status === 'error' || it.status === 'canceled') && it.error && (
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{it.error}</p>
                )}
              </div>
              <div className="shrink-0 flex items-center gap-1">
                {canRetry && onRetry && (
                  <button
                    onClick={() => onRetry(it.id)}
                    className="p-1.5 rounded-md hover:bg-primary/10 text-primary transition-colors"
                    aria-label={`${t('retry')} ${it.name}`}
                    title={t('retry')}
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                )}
                {canCancel && onCancel && (
                  <button
                    onClick={() => onCancel(it.id)}
                    className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive transition-colors"
                    aria-label={`${t('cancel')} ${it.name}`}
                    title={t('cancel')}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UploadProgressList;
