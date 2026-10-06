import React from 'react';
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';

interface OnlineIndicatorProps {
  count: number;
}

const OnlineIndicator: React.FC<OnlineIndicatorProps> = ({ count }) => {
  const { t } = useT();
  return (
    <div className={cn(
      "flex items-center gap-1.5 sm:gap-2 h-8 px-2 sm:px-3 rounded-full shrink-0",
      "bg-secondary/50 border border-border/50"
    )}>
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
      </span>
      <Users className="w-3.5 h-3.5 text-muted-foreground hidden sm:inline" />
      <span className="text-xs sm:text-sm font-medium text-foreground">{count}</span>
      <span className="text-xs text-muted-foreground hidden sm:inline">{t('online')}</span>
    </div>

  );
};

export default OnlineIndicator;
