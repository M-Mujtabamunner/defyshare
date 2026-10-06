import React from 'react';
import { Wifi, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useLocalNetwork } from '@/hooks/useLocalNetwork';
import { useT } from '@/lib/i18n';

interface RoomInfoProps {
  localIP: string;
  roomId: string;
  fileCount: number;
  /** Rendered under the network details (this device's name). */
  footer?: React.ReactNode;
}

const RoomInfo: React.FC<RoomInfoProps> = ({ localIP, roomId, fileCount, footer }) => {
  const { t } = useT();
  const [copied, setCopied] = useState(false);
  const { networkName, connectionType } = useLocalNetwork();

  const copyIP = async () => {
    await navigator.clipboard.writeText(localIP);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isDetecting = localIP === 'detecting...' || networkName === 'detecting...';

  return (
    <div className="rounded-lg bg-secondary/30 border border-border/50 w-full min-w-0">
    <div className="flex items-center justify-between gap-3 p-3 sm:p-4 min-w-0">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className={cn(
          "p-2 rounded-lg shrink-0",
          !isDetecting ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        )}>
          <Wifi className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          {/* Show the actual detected network label instead of static "Your Network" */}
          <p className="text-xs sm:text-sm text-muted-foreground truncate">
            {isDetecting ? t('yourNetwork') : networkName}
          </p>
          <div className="flex items-center gap-1 min-w-0">
            <code className="font-mono text-xs sm:text-sm text-foreground truncate">{localIP}</code>
            {localIP !== 'detecting...' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={copyIP}
                className="h-6 w-6 shrink-0"
              >
                {copied ? (
                  <Check className="w-3 h-3 text-primary" />
                ) : (
                  <Copy className="w-3 h-3 text-muted-foreground" />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="text-end shrink-0">
        <p className="text-xl sm:text-2xl font-bold font-mono text-primary leading-tight">{fileCount}</p>
        <p className="text-xs text-muted-foreground">
          {fileCount === 1 ? t('fileShared') : t('filesShared')}
        </p>
      </div>
    </div>
    {footer && <div className="border-t border-border/50 px-3 sm:px-4 py-2">{footer}</div>}
    </div>
  );
};

export default RoomInfo;
