import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Trash2, FileIcon, MessageSquareText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DropZone, { collectFilesFromDataTransfer } from '@/components/DropZone';
import FileList from '@/components/FileList';
import RoomInfo from '@/components/RoomInfo';
import TextShare from '@/components/TextShare';
import OnlineIndicator from '@/components/OnlineIndicator';
import UploadProgress from '@/components/UploadProgress';
import UploadProgressList from '@/components/UploadProgressList';
import SettingsSheet from '@/components/SettingsSheet';
import FilePreviewModal from '@/components/FilePreviewModal';
import UploadAnywhere from '@/components/UploadAnywhere';
import AdSlot from '@/components/AdSlot';
import { usePublicIP } from '@/hooks/usePublicIP';
import { useFileSharing, SharedFile } from '@/hooks/useFileSharing';
import { useTextSharing } from '@/hooks/useTextSharing';
import { useOnlinePresence } from '@/hooks/useOnlinePresence';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import logoMark from '@/assets/logo-mark.png';
import { HOME_FAQ } from '@/data/homeFaq';

const NOTIF_KEY = 'defyshare:notifications';


const Index = () => {
  const { publicIP, roomId, verified } = usePublicIP();
  const { files, loading: filesLoading, uploadState, addFiles, removeFile, downloadFile, clearAll, cancelUpload, retryUpload, dismissUploads } = useFileSharing(roomId);
  const { texts, loading: textsLoading, addText, removeText, clearAllTexts } = useTextSharing(roomId);
  const onlineCount = useOnlinePresence(roomId);
  const { user } = useAuth();
  const { toast } = useToast();

  const [previewFile, setPreviewFile] = useState<SharedFile | null>(null);
  const [tab, setTab] = useState('files');
  const pendingRef = useRef<File[]>([]);

  const notificationsEnabled = () => {
    try {
      return localStorage.getItem(NOTIF_KEY) !== 'false';
    } catch {
      return true;
    }
  };

  const uploaderName = (user?.user_metadata?.full_name as string) || user?.email?.split('@')[0] || 'Anonymous';

  const uploadBatch = useCallback(
    async (incoming: File[]) => {
      if (incoming.length === 0) return;
      setTab('files');
      // Wait for the network check so files never land in a stale room.
      if (!verified) {
        pendingRef.current.push(...incoming);
        return;
      }
      const result = await addFiles(incoming, {
        uploader_name: uploaderName,
        uploader_email: user?.email ?? null,
        uploader_id: user?.id ?? null,
      });
      if (result.failed > 0) {
        toast({ title: `${result.failed} of ${incoming.length} failed`, variant: 'destructive' });
      } else if (notificationsEnabled()) {
        toast({ title: incoming.length === 1 ? 'File shared' : `${result.ok} files shared` });
      }
    },
    [verified, addFiles, uploaderName, user, toast],
  );

  useEffect(() => {
    if (verified && pendingRef.current.length > 0) {
      const queued = pendingRef.current;
      pendingRef.current = [];
      uploadBatch(queued);
    }
  }, [verified, uploadBatch]);

  // Clear the progress panel shortly after a fully successful batch.
  useEffect(() => {
    const { isUploading, items } = uploadState;
    if (isUploading || items.length === 0 || items.some((it) => it.status !== 'done')) return;
    const t = setTimeout(dismissUploads, 2500);
    return () => clearTimeout(t);
  }, [uploadState, dismissUploads]);

  // Paste files anywhere to upload them
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const pasted = Array.from(e.clipboardData?.files || []);
      if (pasted.length === 0) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (e.clipboardData?.getData('text') && (tag === 'TEXTAREA' || tag === 'INPUT')) return;
      e.preventDefault();
      uploadBatch(pasted);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [uploadBatch]);

  const downloadAll = async () => {
    for (const f of files) {
      await downloadFile(f).catch(() => undefined);
      await new Promise((r) => setTimeout(r, 350));
    }
  };

  const countBadge = (n: number) =>
    n > 0 && <span className="ml-1 px-1.5 py-px text-[11px] rounded-full bg-primary/15 text-primary tabular-nums">{n}</span>;

  return (
    <div className="min-h-screen bg-background" data-upload-surface>
      <div
        className="mx-auto w-full max-w-[1120px] px-3 sm:px-4 xl:grid xl:grid-cols-[160px_minmax(0,672px)_160px] xl:justify-center xl:gap-8"
        data-upload-surface
      >
        <div className="hidden xl:block pt-24" data-upload-surface>
          <AdSlot placement="rail" className="sticky top-6" />
        </div>

        <main className="w-full max-w-2xl mx-auto py-5 sm:py-8" data-upload-surface>
          <header className="mb-5">
            <div className="flex items-center justify-between gap-2 w-full min-w-0">
              <a href="/" className="flex items-center gap-2 sm:gap-2.5 shrink-0" aria-label="DefyShare home">
                <img src={logoMark} alt="DefyShare logo" width={40} height={40} className="w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] shrink-0" />
                <span className="text-xl sm:text-2xl font-bold tracking-tight">
                  Defy<span className="text-primary">Share</span>
                </span>
              </a>
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <OnlineIndicator count={onlineCount} />
                <SettingsSheet />
                {/* Google sign-in is hidden until it is set up directly in Supabase (it ran through Lovable). */}
              </div>
            </div>
            <h1 className="mt-3 text-sm sm:text-[15px] text-muted-foreground">
              Share files &amp; text between devices on the same Wi-Fi — free, no sign-up.
            </h1>
          </header>

          <div className="mb-4">
            <RoomInfo localIP={publicIP} roomId={roomId} fileCount={files.length + texts.length} />
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-2 bg-secondary/70 border border-border/60">
              <TabsTrigger value="files" className="gap-2 data-[state=active]:bg-card data-[state=active]:text-primary">
                <FileIcon className="w-4 h-4" />
                Files
                {countBadge(files.length)}
              </TabsTrigger>
              <TabsTrigger value="text" className="gap-2 data-[state=active]:bg-card data-[state=active]:text-primary">
                <MessageSquareText className="w-4 h-4" />
                Text
                {countBadge(texts.length)}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="files" className="mt-3 space-y-3">
              <DropZone onFilesDrop={uploadBatch} isUploading={uploadState.isUploading} />

              {uploadState.items.length > 0 ? (
                <UploadProgressList
                  items={uploadState.items}
                  aggregate={uploadState.progress}
                  totalFiles={uploadState.totalFiles}
                  completedFiles={uploadState.completedFiles}
                  onCancel={cancelUpload}
                  onRetry={retryUpload}
                  onDismiss={!uploadState.isUploading ? dismissUploads : undefined}
                />
              ) : uploadState.isUploading ? (
                <UploadProgress progress={uploadState.progress} fileName={uploadState.fileName} />
              ) : null}

              {files.length > 0 && (
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-medium text-muted-foreground">
                    {files.length} shared<span className="hidden sm:inline"> · auto-deleted after 3h</span>
                  </h2>
                  <div className="flex items-center">
                    <Button variant="ghost" size="sm" onClick={downloadAll} className="h-7 text-xs text-muted-foreground hover:text-primary">
                      <Download className="w-3.5 h-3.5 mr-1" />
                      Download all
                    </Button>
                    <Button variant="ghost" size="sm" onClick={clearAll} className="h-7 text-xs text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      Clear all
                    </Button>
                  </div>
                </div>
              )}

              <FileList
                files={files}
                loading={filesLoading}
                onDownload={(f) => downloadFile(f).catch(() => toast({ title: 'Download failed', variant: 'destructive' }))}
                onRemove={removeFile}
                onPreview={setPreviewFile}
              />
            </TabsContent>

            <TabsContent value="text" className="mt-3">
              <TextShare texts={texts} loading={textsLoading} onAdd={addText} onRemove={removeText} onClearAll={clearAllTexts} />
            </TabsContent>
          </Tabs>

          <AdSlot placement="inContent" className="mt-8" />

          <section className="mt-10 space-y-7 text-sm leading-relaxed">
            <div>
              <h2 className="text-lg font-semibold mb-1.5">Share files between your devices in seconds</h2>
              <p className="text-muted-foreground">
                DefyShare moves photos, videos, documents, archives, folders and text between your phone, laptop and tablet without
                cables, email or sign-up. Open this page on every device connected to the same Wi-Fi and they join the same
                private room automatically.
              </p>
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-1.5">How to use DefyShare</h2>
              <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
                <li>Open defyshare.app on two or more devices on the same network.</li>
                <li>Drop files or a folder onto the page, click anywhere to pick files, or paste with Ctrl+V.</li>
                <li>They appear instantly on your other devices — open, preview or download them.</li>
                <li>Everything is deleted automatically after 3 hours.</li>
              </ol>
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-1.5">Frequently asked questions</h2>
              {HOME_FAQ.map(({ q, a }) => (
                <div key={q} className="mt-3">
                  <h3 className="font-medium">{q}</h3>
                  <p className="text-muted-foreground">{a}</p>
                </div>
              ))}
            </div>
          </section>

          <AdSlot placement="rectangle" className="mt-10" />

          <footer className="mt-8 pb-14 text-center text-xs text-muted-foreground space-y-2">
            <nav className="flex flex-wrap justify-center gap-x-4 gap-y-1">
              <a href="/about" className="hover:text-primary">About</a>
              <a href="/privacy" className="hover:text-primary">Privacy</a>
              <a href="/terms" className="hover:text-primary">Terms</a>
              <a href="/contact" className="hover:text-primary">Contact</a>
              <a href="/press" className="hover:text-primary">Press</a>
            </nav>
            <p>© {new Date().getFullYear()} DefyShare</p>
          </footer>
        </main>

        <div className="hidden xl:block pt-24" data-upload-surface>
          <AdSlot placement="rail" className="sticky top-6" />
        </div>
      </div>

      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />

      <UploadAnywhere
        onFiles={uploadBatch}
        onDrop={async (dt) => uploadBatch(await collectFilesFromDataTransfer(dt))}
        disabled={uploadState.isUploading}
      />
    </div>
  );
};

export default Index;
