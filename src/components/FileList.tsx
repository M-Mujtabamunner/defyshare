import React, { useEffect, useState } from 'react';
import { Download, Trash2, FileText, Image as ImageIcon, Film, Music, Archive, File, Loader2, Clock, Link2, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SharedFile } from '@/hooks/useFileSharing';
import { getSignedFileUrl } from '@/lib/storageUrls';
import { isArchive } from '@/lib/fileTypes';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FileListProps {
  files: SharedFile[];
  loading?: boolean;
  onDownload: (file: SharedFile) => void;
  onRemove: (fileId: string) => void;
  onPreview?: (file: SharedFile) => void;
}

const getFileIcon = (file: SharedFile) => {
  const type = file.type || '';
  if (type.startsWith('image/')) return ImageIcon;
  if (type.startsWith('video/')) return Film;
  if (type.startsWith('audio/')) return Music;
  if (isArchive(type, file.name)) return Archive;
  if (type.includes('text') || type.includes('document') || type.includes('pdf')) return FileText;
  return File;
};

const isPreviewable = (type: string) =>
  type.startsWith('image/') || type.startsWith('video/') || type.startsWith('audio/') || type === 'application/pdf';

const formatFileSize = (bytes: number) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(k)));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const formatExpiry = (expiresAt: string) => {
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  if (diffMs <= 0) return 'expired';
  const mins = Math.max(1, Math.floor(diffMs / 60000));
  const h = Math.floor(mins / 60);
  return h > 0 ? `${h}h ${mins % 60}m` : `${mins}m`;
};

const splitPath = (name: string) => {
  const i = name.lastIndexOf('/');
  return i === -1 ? { dir: '', base: name } : { dir: name.slice(0, i), base: name.slice(i + 1) };
};

const useSignedUrl = (filePath: string) => {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    getSignedFileUrl(filePath).then((u) => active && setUrl(u));
    return () => {
      active = false;
    };
  }, [filePath]);
  return url;
};

const FileRow: React.FC<{
  file: SharedFile;
  onDownload: (file: SharedFile) => void;
  onRemove: (fileId: string) => void;
  onPreview?: (file: SharedFile) => void;
}> = ({ file, onDownload, onRemove, onPreview }) => {
  const { toast } = useToast();
  const url = useSignedUrl(file.file_path);
  const [copied, setCopied] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);
  const Icon = getFileIcon(file);
  const { dir, base } = splitPath(file.name);
  const canPreview = !!onPreview && isPreviewable(file.type || '');
  const showThumb = (file.type || '').startsWith('image/') && url && !thumbFailed;

  const copyLink = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
      toast({ title: 'Link copied' });
    } catch {
      toast({ title: 'Copy failed', variant: 'destructive' });
    }
  };

  return (
    <div
      className={cn(
        'group flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-card border border-border/70',
        'hover:border-primary/40 transition-colors',
        canPreview && 'cursor-pointer',
      )}
      onClick={() => canPreview && onPreview?.(file)}
    >
      {showThumb ? (
        <img
          src={url}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setThumbFailed(true)}
          className="w-9 h-9 rounded-md object-cover bg-secondary shrink-0"
        />
      ) : (
        <div className="w-9 h-9 rounded-md bg-primary/10 text-primary grid place-items-center shrink-0">
          <Icon className="w-4 h-4" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate leading-tight" title={file.name}>
          {base}
        </p>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5 min-w-0">
          {dir && <span className="hidden sm:inline truncate max-w-[40%]">{dir}/</span>}
          <span className="tabular-nums shrink-0">{formatFileSize(file.size)}</span>
          <span className="opacity-40">·</span>
          <span className="inline-flex items-center gap-0.5 tabular-nums shrink-0">
            <Clock className="w-3 h-3" /> {formatExpiry(file.expires_at)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-link bg-link-bg hover:underline px-2 py-1 rounded-md mr-0.5"
          >
            <ExternalLink className="w-3 h-3" />
            Open
          </a>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={copyLink}
          disabled={!url}
          title="Copy link"
          className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
        >
          {copied ? <Check className="w-4 h-4 text-primary" /> : <Link2 className="w-4 h-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDownload(file)}
          title="Download"
          className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
        >
          <Download className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(file.id)}
          title="Delete"
          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

const FileList: React.FC<FileListProps> = ({ files, loading, onDownload, onRemove, onPreview }) => {
  if (loading && files.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        Loading files…
      </div>
    );
  }

  if (files.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No files shared yet</p>;
  }

  return (
    <div className="space-y-1.5">
      {files.map((file) => (
        <FileRow key={file.id} file={file} onDownload={onDownload} onRemove={onRemove} onPreview={onPreview} />
      ))}
    </div>
  );
};

export default FileList;
