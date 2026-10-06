import React, { useCallback, useRef, useState } from 'react';
import { Upload, FolderUp, FilePlus2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';

interface DropZoneProps {
  onFilesDrop: (files: File[]) => Promise<void> | void;
  isUploading: boolean;
}

// Recursively walk a dropped entry to gather files (folder support)
const readEntries = (reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> =>
  new Promise((resolve, reject) => reader.readEntries(resolve, reject));

const walkEntry = async (entry: FileSystemEntry, path = ''): Promise<File[]> => {
  if (entry.isFile) {
    return new Promise<File[]>((resolve, reject) =>
      (entry as FileSystemFileEntry).file((file: File) => {
        try {
          // preserve relative path
          Object.defineProperty(file, 'webkitRelativePath', { value: path + file.name });
        } catch { /* ignore */ }
        resolve([file]);
      }, reject),
    );
  }
  if (entry.isDirectory) {
    const reader = (entry as FileSystemDirectoryEntry).createReader();
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
    .map((item) => item.webkitGetAsEntry?.())
    .filter((e): e is FileSystemEntry => !!e);
  if (entries.length > 0) {
    const groups = await Promise.all(entries.map((e) => walkEntry(e)));
    return groups.flat();
  }
  return Array.from(dt.files || []);
};

const DropZone: React.FC<DropZoneProps> = ({ onFilesDrop, isUploading }) => {
  const { t } = useT();
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

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

  const pick = (ref: React.RefObject<HTMLInputElement>) => (e: React.MouseEvent) => {
    e.stopPropagation();
    ref.current?.click();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      data-upload-zone
      onClick={() => fileInputRef.current?.click()}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileInputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={cn(
        'group flex items-center gap-2.5 sm:gap-3 rounded-xl border-2 border-dashed px-2.5 sm:px-3 py-2.5 cursor-pointer transition-colors',
        isDragOver ? 'border-primary bg-primary/10' : 'border-border bg-card/60 hover:border-primary/60 hover:bg-primary/5',
        isUploading && 'pointer-events-none opacity-70',
      )}
    >
      <div className="grid place-items-center w-9 h-9 rounded-lg bg-primary text-primary-foreground shrink-0">
        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
      </div>
      <p className="flex-1 min-w-0 text-sm font-medium truncate">
        {isUploading ? t('uploading') : isDragOver ? t('releaseToUpload') : (
          <>
            <span className="sm:hidden">{t('addFiles')}</span>
            <span className="hidden sm:inline">{t('dropHere')}</span>
          </>
        )}
      </p>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={pick(fileInputRef)}
          disabled={isUploading}
          className="inline-flex items-center justify-center gap-1.5 h-9 min-w-9 text-xs font-medium px-2.5 rounded-lg border border-border bg-background hover:border-primary/50 hover:text-primary transition-colors"
        >
          <FilePlus2 className="w-4 h-4 shrink-0" />
          <span className="hidden min-[400px]:inline">{t('filesBtn')}</span>
        </button>
        <button
          type="button"
          onClick={pick(folderInputRef)}
          disabled={isUploading}
          className="inline-flex items-center justify-center gap-1.5 h-9 min-w-9 text-xs font-medium px-2.5 rounded-lg border border-border bg-background hover:border-primary/50 hover:text-primary transition-colors"
        >
          <FolderUp className="w-4 h-4 shrink-0" />
          <span className="hidden min-[400px]:inline">{t('folderBtn')}</span>
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        onClick={(e) => e.stopPropagation()}
        className="hidden"
        disabled={isUploading}
        aria-label={t('filesBtn')}
      />
      <input
        ref={folderInputRef}
        type="file"
        // @ts-expect-error non-standard but widely supported
        webkitdirectory=""
        directory=""
        multiple
        onChange={handleFileSelect}
        onClick={(e) => e.stopPropagation()}
        className="hidden"
        disabled={isUploading}
        aria-label={t('folderBtn')}
      />
    </div>
  );
};

export default DropZone;
