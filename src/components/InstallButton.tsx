import React from 'react';
import { Download, Plus, Share } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useInstall } from '@/hooks/useInstall';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/** Header button to install the app; hidden once installed or when the browser can't. */
const InstallButton: React.FC<{ className?: string; full?: boolean }> = ({ className, full }) => {
  const { t } = useT();
  const { mode, install } = useInstall();
  if (!mode) return null;

  const button = (
    <button
      type="button"
      onClick={mode === 'prompt' ? () => install() : undefined}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-full bg-primary text-primary-foreground font-medium shadow-sm hover:bg-primary/90 transition-colors',
        full ? 'w-full h-10 text-sm' : 'h-8 px-3 text-xs',
        className,
      )}
    >
      <Download className="w-3.5 h-3.5" />
      {full ? t('installApp') : t('install')}
    </button>
  );

  if (mode === 'prompt') return button;

  // iOS has no install prompt: show the two taps instead.
  return (
    <Popover>
      <PopoverTrigger asChild>{button}</PopoverTrigger>
      <PopoverContent align="end" className="w-64 text-sm">
        <p className="font-semibold mb-1">{t('installApp')}</p>
        <p className="text-muted-foreground flex items-center flex-wrap gap-1">
          <Share className="w-4 h-4 inline" /> <Plus className="w-4 h-4 inline" /> {t('installIOS')}
        </p>
      </PopoverContent>
    </Popover>
  );
};

export default InstallButton;
