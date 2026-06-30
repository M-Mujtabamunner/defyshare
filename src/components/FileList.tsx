import React, { useEffect, useState } from 'react';
import { Download, Trash2, FileText, Image as ImageIcon, Film, Music, Archive, File, Loader2, Infinity as InfinityIcon, Clock, Link2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SharedFile } from '@/hooks/useFileSharing';
import { getSignedFileUrl } from '@/lib/storageUrls';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FileListProps {
  files: SharedFile[];
  loading?: boolean;
  onDownload: (file: SharedFile) => void;
  onRemove: (fileId: string) => void;
  onPreview?: (file: SharedFile) => void;
}

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return ImageIcon;
  if (type.startsWith('video/')) return Film;
  if (type.startsWith('audio/')) return Music;
  if (type.includes('zip') || type.includes('rar') || type.includes('tar')) return Archive;
  if (type.includes('text') || type.includes('document') || type.includes('pdf')) return FileText;
  return File;
};

const isPreviewable = (type: string) =>
  type.startsWith('image/') || type.startsWith('video/') || type.startsWith('audio/') || type === 'application/pdf';

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const formatTime = (timestamp: string) =>
  new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const formatExpiry = (expiresAt: string) => {
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  if (diffMs <= 0) return 'expired';
  const hours = Math.floor(diffMs / 3600000);
  if (hours >= 1) return `${hours}h left`;
  const mins = Math.max(1, Math.floor(diffMs / 60000));
  return `${mins}m left`;
};

const Thumb: React.FC<{ file: SharedFile }> = ({ file }) => {
  const Icon = getFileIcon(file.type);
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const isImage = file.type.startsWith('image/');

  useEffect(() => {
    if (!isImage) return;
    let active = true;
    getSignedFileUrl(file.file_path).then((u) => {
      if (active) setUrl(u);
    });
    return () => {
      active = false;
    };
  }, [file.file_path, isImage]);

  if (isImage && url && !failed) {
    return (
      <img
        src={url}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        className="w-10 h-10 rounded-lg object-cover border border-border/50 bg-secondary"
      />
    );
  }
  return (
    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
      <Icon className="w-5 h-5" />
    </div>
  );
};

const FileList: React.FC<FileListProps> = ({ files, loading, onDownload, onRemove, onPreview }) => {
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const flash = (id: string) => {
    setCopiedId(id);
    setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1200);
  };

  const copyText = async (text: string, label: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      flash(id);
      toast({ title: `${label} copied`, description: text.length > 60 ? text.slice(0, 60) + '…' : text });
    } catch {
      toast({ title: 'Copy failed', variant: 'destructive' });
    }
  };

  const copyLink = async (file: SharedFile) => {
    const url = await getSignedFileUrl(file.file_path);
    if (!url) {
      toast({ title: 'Could not create link', variant: 'destructive' });
      return;
    }
    await copyText(url, 'Link', `link-${file.id}`);
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-primary" />
        <p>Loading files...</p>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <File className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>No files shared yet</p>
        <p className="text-sm mt-1">Drop some files to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {files.map((file, index) => {
        const canPreview = !!onPreview && isPreviewable(file.type);
        return (
          <div
            key={file.id}
            className={cn(
              'group flex items-center gap-4 p-4 rounded-lg bg-secondary/50 border border-border/50',
              'hover:bg-secondary hover:border-primary/30 transition-all duration-200',
              'animate-fade-in',
              canPreview && 'cursor-pointer',
            )}
            style={{ animationDelay: `${index * 50}ms` }}
            onClick={() => canPreview && onPreview?.(file)}
          >
            <Thumb file={file} />

            <div className="flex-1 min-w-0">
              <p className="font-medium truncate font-mono text-sm">
                {file.subject || file.name}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                {file.uploader_name && (
                  <>
                    <span className="text-primary/80">{file.uploader_name}</span>
                    <span>•</span>
                  </>
                )}
                <span className="truncate max-w-[140px]">{file.name}</span>
                <span>•</span>
                <span>{formatFileSize(file.size)}</span>
                <span>•</span>
                <span>{formatTime(file.created_at)}</span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  {file.keep_forever ? (
                    <><InfinityIcon className="w-3 h-3" /> kept</>
                  ) : (
                    <><Clock className="w-3 h-3" /> {formatExpiry(file.expires_at)}</>
                  )}
                </span>
              </div>
            </div>

            <div
              className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDownload(file)}
                className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemove(file.id)}
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FileList;
