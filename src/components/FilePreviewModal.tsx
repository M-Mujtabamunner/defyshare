import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { SharedFile } from '@/hooks/useFileSharing';
import { getSignedFileUrl } from '@/lib/storageUrls';
import { formatFileSize, isPreviewable, splitPath } from '@/lib/fileKinds';
import { useT } from '@/lib/i18n';

interface Props {
  file: SharedFile | null;
  /** The list the file was opened from; arrows step through the previewable ones. */
  siblings?: SharedFile[];
  onNavigate?: (file: SharedFile) => void;
  onDownload?: (file: SharedFile) => void;
  onClose: () => void;
}

const navButton =
  'grid place-items-center w-9 h-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 disabled:pointer-events-none transition-colors';

const FilePreviewModal: React.FC<Props> = ({ file, siblings = [], onNavigate, onDownload, onClose }) => {
  const { t } = useT();
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    setUrl(null);
    if (!file) return;
    let active = true;
    getSignedFileUrl(file.file_path).then((u) => {
      if (active) setUrl(u);
    });
    return () => {
      active = false;
    };
  }, [file]);

  const steps = siblings.filter((f) => isPreviewable(f.type || ''));
  const index = file ? steps.findIndex((f) => f.id === file.id) : -1;
  const prev = index > 0 ? steps[index - 1] : null;
  const next = index >= 0 && index < steps.length - 1 ? steps[index + 1] : null;

  useEffect(() => {
    if (!file || !onNavigate) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'VIDEO' || tag === 'AUDIO' || tag === 'INPUT') return;
      const rtl = document.documentElement.dir === 'rtl';
      const back = rtl ? 'ArrowRight' : 'ArrowLeft';
      const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
      if (e.key === back && prev) onNavigate(prev);
      if (e.key === forward && next) onNavigate(next);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [file, prev, next, onNavigate]);

  if (!file) return null;
  const type = file.type || '';
  const { base } = splitPath(file.name);

  let content: React.ReactNode;
  if (!url) {
    content = <p className="py-16 text-center text-sm text-muted-foreground">{t('loadingPreview')}</p>;
  } else if (type.startsWith('image/')) {
    content = <img src={url} alt={base} className="max-h-[68vh] max-w-full mx-auto object-contain" />;
  } else if (type.startsWith('video/')) {
    content = <video src={url} controls autoPlay className="max-h-[68vh] w-full bg-black" />;
  } else if (type.startsWith('audio/')) {
    content = (
      <div className="px-5 py-12">
        <audio src={url} controls autoPlay className="w-full" />
      </div>
    );
  } else if (type === 'application/pdf' || type === 'text/plain') {
    content = <iframe src={url} title={base} className="w-full h-[68vh] bg-white" />;
  } else {
    content = <p className="py-16 text-center text-sm text-muted-foreground">{t('noPreview')}</p>;
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl w-[calc(100vw-1.5rem)] p-0 gap-0 overflow-hidden rounded-2xl">
        <div className="flex items-center gap-3 ps-5 pe-14 py-3.5 border-b border-border">
          <div className="min-w-0 flex-1">
            <DialogTitle className="truncate text-[15px] font-medium leading-snug">{file.subject || base}</DialogTitle>
            <DialogDescription className="flex gap-3 text-xs tabular-nums">
              <span>{formatFileSize(file.size)}</span>
              {steps.length > 1 && index >= 0 && (
                <span>
                  {index + 1} / {steps.length}
                </span>
              )}
            </DialogDescription>
          </div>
        </div>

        <div className="bg-secondary/50 min-h-[10rem] grid items-center">{content}</div>

        <div className="flex items-center gap-1 px-3 py-2.5 border-t border-border">
          {steps.length > 1 && onNavigate && (
            <>
              <button type="button" className={navButton} disabled={!prev} onClick={() => prev && onNavigate(prev)} aria-label={t('previous')} title={t('previous')}>
                <ChevronLeft className="w-5 h-5 rtl:-scale-x-100" />
              </button>
              <button type="button" className={navButton} disabled={!next} onClick={() => next && onNavigate(next)} aria-label={t('next')} title={t('next')}>
                <ChevronRight className="w-5 h-5 rtl:-scale-x-100" />
              </button>
            </>
          )}
          <span className="flex-1" />
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              {t('open')}
            </a>
          )}
          {onDownload && (
            <button
              type="button"
              onClick={() => onDownload(file)}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-foreground text-background text-sm font-medium hover:bg-foreground/85 transition-colors"
            >
              <Download className="w-4 h-4" />
              {t('download')}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FilePreviewModal;
