import React from 'react';
import { Wifi, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface RoomInfoProps {
  localIP: string;
  roomId: string;
  fileCount: number;
}

const RoomInfo: React.FC<RoomInfoProps> = ({ localIP, roomId, fileCount }) => {
  const [copied, setCopied] = useState(false);

  const copyIP = async () => {
    await navigator.clipboard.writeText(localIP);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/50">
      <div className="flex items-center gap-3">
        <div className={cn(
          "p-2 rounded-lg",
          localIP !== 'detecting...' ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        )}>
          <Wifi className="w-4 h-4" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Your Network</p>
          <div className="flex items-center gap-2">
            <code className="font-mono text-sm text-foreground">{localIP}</code>
            {localIP !== 'detecting...' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={copyIP}
                className="h-6 w-6"
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
      
      <div className="text-right">
        <p className="text-2xl font-bold font-mono text-primary">{fileCount}</p>
        <p className="text-xs text-muted-foreground">
          {fileCount === 1 ? 'file' : 'files'} shared
        </p>
      </div>
    </div>
  );
};

export default RoomInfo;
