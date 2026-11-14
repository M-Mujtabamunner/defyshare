import React, { useEffect, useState } from 'react';
import { Check, Copy, Share2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SharedFile } from '@/hooks/useFileSharing';
import { getSignedFileUrl } from '@/lib/storageUrls';
import { splitPath } from '@/lib/fileKinds';
import { useToast } from '@/hooks/use-toast';
import { useT } from '@/lib/i18n';

/** QR codes are always dark-on-white so every phone camera can read them. */
export const QrTile: React.FC<{ value: string; size?: number; className?: string }> = ({ value, size = 168, className }) => (
  <div className={className} style={{ background: '#fff', padding: 10, borderRadius: 14, lineHeight: 0, width: 'fit-content' }}>
    <QRCodeSVG value={value} size={size} level="L" bgColor="#ffffff" fgColor="#15171C" />
  </div>
);

interface Props {
  file: SharedFile | null;
  onClose: () => void;
}

/** A file's link as a QR code, for handing it to a device that isn't in the room. */
const ShareLinkDialog: React.FC<Props> = ({ file, onClose }) => {
  const { t } = useT();
  const { toast } = useToast();
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUrl(null);
    setCopied(false);
    if (!file) return;
    let active = true;
    getSignedFileUrl(file.file_path).then((u) => active && setUrl(u));
    return () => {
      active = false;
    };
  }, [file]);

  if (!file) return null;
  const { base } = splitPath(file.name);
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const copy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast({ title: t('linkCopied') });
    } catch {
      toast({ title: t('copyFailed'), variant: 'destructive' });
    }
  };

  const share = () => {
    if (url) navigator.share({ title: base, url }).catch(() => undefined);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm w-[calc(100vw-1.5rem)] rounded-2xl">
        <DialogHeader className="text-start">
          <DialogTitle className="truncate pe-6 text-base font-medium">{base}</DialogTitle>
          <DialogDescription>{t('shareLinkHint')}</DialogDescription>
        </DialogHeader>

        <div className="grid place-items-center py-2 min-h-[212px]">
          {url ? <QrTile value={url} size={192} className="border border-border" /> : <p className="text-sm text-muted-foreground">{t('loading')}</p>}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={copy}
            disabled={!url}
            className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-full bg-foreground text-background text-sm font-medium hover:bg-foreground/85 disabled:opacity-50 transition-colors"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {t('copyLink')}
          </button>
          {canShare && (
            <button
              type="button"
              onClick={share}
              disabled={!url}
              className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full border border-border text-sm font-medium hover:bg-secondary disabled:opacity-50 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              {t('shareVia')}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareLinkDialog;
