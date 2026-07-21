import React, { useCallback, useRef, useState } from 'react';
import { Upload, FileIcon, FolderUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DropZoneProps {
  onFilesDrop: (files: File[]) => Promise<void> | void;
  isUploading: boolean;
}

// Recursively walk a DataTransferItem entry to gather files (folder support)
const readEntries = (reader: any): Promise<any[]> =>
  new Promise((resolve, reject) => reader.readEntries(resolve, reject));

const walkEntry = async (entry: any, path = ''): Promise<File[]> => {
  if (entry.isFile) {
    return new Promise<File[]>((resolve, reject) =>
      entry.file((file: File) => {
        try {
          // preserve relative path
          Object.defineProperty(file, 'webkitRelativePath', { value: path + file.name });
        } catch { /* ignore */ }
        resolve([file]);
      }, reject),
    );
  }
  if (entry.isDirectory) {
    const reader = entry.createReader();
    const all: File[] = [];
    let batch = await readEntries(reader);
    while (batch.length > 0) {
      for (const child of batch) {
        const files = await walkEntry(child, path + entry.name + '/');
        all.push(...files);
      }
      batch = await readEntries(reader);
    }
    return all;
  }
  return [];
};

export const collectFilesFromDataTransfer = async (dt: DataTransfer): Promise<File[]> => {
  const items = dt.items ? Array.from(dt.items) : [];
  const entries = items
    .map((item) => (item as any).webkitGetAsEntry?.())
    .filter(Boolean);
  if (entries.length > 0) {
    const groups = await Promise.all(entries.map((e) => walkEntry(e)));
    return groups.flat();
  }
  return Array.from(dt.files || []);
};

const DropZone: React.FC<DropZoneProps> = ({ onFilesDrop, isUploading }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const files = await collectFilesFromDataTransfer(e.dataTransfer);
      if (files.length > 0) await onFilesDrop(files);
    },
    [onFilesDrop],
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      e.target.value = '';
      if (files.length > 0) await onFilesDrop(files);
    },
    [onFilesDrop],
  );

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'relative overflow-hidden rounded-xl border-2 border-dashed transition-all duration-300 group',
        isDragOver ? 'border-primary bg-primary/5 glow-primary' : 'border-border hover:border-primary/50 hover:bg-secondary/30',
        isUploading && 'pointer-events-none opacity-70',
      )}
    >
      <input
        type="file"
        multiple
        onChange={handleFileSelect}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        disabled={isUploading}
        aria-label="Choose files"
      />

      <div className="px-4 py-5 sm:p-10 md:p-12 flex flex-col items-center justify-center gap-2.5 sm:gap-4 relative z-0">
        <div
          className={cn(
            'p-2.5 sm:p-4 rounded-full bg-secondary transition-all duration-300',
            isDragOver && 'bg-primary/20 scale-110',
            'group-hover:bg-primary/10',
          )}
        >
          {isUploading ? (
            <FileIcon className="w-5 h-5 sm:w-8 sm:h-8 text-primary animate-pulse" />
          ) : (
            <Upload
              className={cn(
                'w-5 h-5 sm:w-8 sm:h-8 transition-colors duration-300',
                isDragOver ? 'text-primary' : 'text-muted-foreground group-hover:text-primary',
              )}
            />
          )}
        </div>

        <div className="text-center">
          <p className={cn('font-medium text-sm sm:text-base transition-colors duration-300', isDragOver ? 'text-primary text-glow' : 'text-foreground')}>
            {isUploading ? 'Uploading…' : 'Drop files or tap to upload'}
          </p>
          <p className="hidden sm:block text-sm text-muted-foreground mt-1">click to pick files, or use the folder button below</p>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            folderInputRef.current?.click();
          }}
          className="relative z-20 inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-md border border-border bg-background/60 hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition"
          disabled={isUploading}
        >
          <FolderUp className="w-4 h-4" />
          Upload folder
        </button>
        <input
          ref={folderInputRef}
          type="file"
          // @ts-expect-error non-standard but widely supported
          webkitdirectory=""
          directory=""
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />
      </div>

      {isDragOver && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-pulse" />
        </div>
      )}
    </div>
  );
};

export default DropZone;
