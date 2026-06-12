import React, { useCallback, useState } from 'react';
import { Upload, FileIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DropZoneProps {
  onFileDrop: (file: File) => Promise<void>;
  isUploading: boolean;
}

const DropZone: React.FC<DropZoneProps> = ({ onFileDrop, isUploading }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      await onFileDrop(file);
    }
  }, [onFileDrop]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      await onFileDrop(file);
    }
    e.target.value = '';
  }, [onFileDrop]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative overflow-hidden rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer group",
        isDragOver 
          ? "border-primary bg-primary/5 glow-primary" 
          : "border-border hover:border-primary/50 hover:bg-secondary/30",
        isUploading && "pointer-events-none opacity-70"
      )}
    >
      <input
        type="file"
        multiple
        onChange={handleFileSelect}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        disabled={isUploading}
      />
      
      <div className="p-12 flex flex-col items-center justify-center gap-4">
        <div className={cn(
          "p-4 rounded-full bg-secondary transition-all duration-300",
          isDragOver && "bg-primary/20 scale-110",
          "group-hover:bg-primary/10"
        )}>
          {isUploading ? (
            <FileIcon className="w-8 h-8 text-primary animate-pulse" />
          ) : (
            <Upload className={cn(
              "w-8 h-8 transition-colors duration-300",
              isDragOver ? "text-primary" : "text-muted-foreground group-hover:text-primary"
            )} />
          )}
        </div>
        
        <div className="text-center">
          <p className={cn(
            "font-medium transition-colors duration-300",
            isDragOver ? "text-primary text-glow" : "text-foreground"
          )}>
            {isUploading ? 'Uploading...' : 'Drop files here'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            or click to browse
          </p>
        </div>
      </div>

      {/* Animated border effect */}
      {isDragOver && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-pulse" />
        </div>
      )}
    </div>
  );
};

export default DropZone;
