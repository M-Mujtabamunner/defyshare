import React from 'react';
import { cn } from '@/lib/utils';

interface UploadProgressProps {
  progress: number;
  fileName?: string;
}

const UploadProgress: React.FC<UploadProgressProps> = ({ progress, fileName }) => {
  return (
    <div className="w-full space-y-2 animate-fade-in">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground truncate max-w-[200px]">
          {fileName || 'Uploading...'}
        </span>
        <span className="text-primary font-mono">{Math.round(progress)}%</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-300",
            "relative overflow-hidden"
          )}
          style={{ width: `${progress}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[scan_1s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
};

export default UploadProgress;
