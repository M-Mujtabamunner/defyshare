import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { FileIcon } from 'lucide-react';

interface UploadMetadataModalProps {
  file: File | null;
  defaultName?: string;
  open: boolean;
  onCancel: () => void;
  onSubmit: (data: { uploader_name: string; subject: string }) => void;
}

const UploadMetadataModal: React.FC<UploadMetadataModalProps> = ({
  file,
  defaultName = '',
  open,
  onCancel,
  onSubmit,
}) => {
  const [uploaderName, setUploaderName] = useState(defaultName);
  const [subject, setSubject] = useState('');

  useEffect(() => {
    if (open) {
      setUploaderName(defaultName);
      setSubject('');
    }
  }, [open, defaultName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      uploader_name: uploaderName.trim() || 'Anonymous',
      subject: subject.trim() || file?.name || 'Untitled',
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add file details</DialogTitle>
          <DialogDescription>
            Tell others who's sharing and what this file is for.
          </DialogDescription>
        </DialogHeader>

        {file && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border/50">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <FileIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="from">From (Name)</Label>
            <Input
              id="from"
              value={uploaderName}
              onChange={(e) => setUploaderName(e.target.value)}
              placeholder="Your name"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Subject (Title)</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="What is this file for?"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
            <Button type="submit">Upload</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UploadMetadataModal;
