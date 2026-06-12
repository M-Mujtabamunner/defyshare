import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SharedFile } from '@/hooks/useFileSharing';
import { getSignedFileUrl } from '@/lib/storageUrls';

interface Props {
  file: SharedFile | null;
  onClose: () => void;
}

const FilePreviewModal: React.FC<Props> = ({ file, onClose }) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    let active = true;
    getSignedFileUrl(file.file_path).then((u) => {
      if (active) setUrl(u);
    });
    return () => {
      active = false;
    };
  }, [file]);

  if (!file) return null;
  const type = file.type || '';

  let content: React.ReactNode;
  if (!url) {
    content = <div className="text-center py-10 text-muted-foreground">Loading preview…</div>;
  } else if (type.startsWith('image/')) {
    content = <img src={url} alt={file.name} className="max-h-[70vh] mx-auto rounded" />;
  } else if (type.startsWith('video/')) {
    content = <video src={url} controls className="max-h-[70vh] w-full rounded" />;
  } else if (type.startsWith('audio/')) {
    content = <audio src={url} controls className="w-full" />;
  } else if (type === 'application/pdf') {
    content = <iframe src={url} title={file.name} className="w-full h-[70vh] rounded border" />;
  } else {
    content = (
      <div className="text-center py-10 text-muted-foreground">
        <p>No inline preview available for this file type.</p>
        <a href={url} target="_blank" rel="noreferrer" className="text-primary underline mt-2 inline-block">
          Open in new tab
        </a>
      </div>
    );
  }

  return (
    <Dialog open={!!file} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="truncate">{file.subject || file.name}</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};

export default FilePreviewModal;
