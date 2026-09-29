import React, { useEffect, useState } from 'react';
import { Trash2, FileIcon, MessageSquareText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DropZone, { collectFilesFromDataTransfer } from '@/components/DropZone';
import FileList from '@/components/FileList';
import RoomInfo from '@/components/RoomInfo';
import TextShare from '@/components/TextShare';
import ThemeToggle from '@/components/ThemeToggle';
import OnlineIndicator from '@/components/OnlineIndicator';
import UploadProgress from '@/components/UploadProgress';
import UploadProgressList from '@/components/UploadProgressList';
import AuthButton from '@/components/AuthButton';
import SettingsSheet from '@/components/SettingsSheet';
import FilePreviewModal from '@/components/FilePreviewModal';
import GlobalDropOverlay from '@/components/GlobalDropOverlay';
import { usePublicIP } from '@/hooks/usePublicIP';
import { useFileSharing, SharedFile } from '@/hooks/useFileSharing';
import { useTextSharing } from '@/hooks/useTextSharing';
import { useOnlinePresence } from '@/hooks/useOnlinePresence';
import { useAuth } from '@/hooks/useAuth';
import { usePromoOverride } from '@/hooks/usePromoOverride';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/components/ThemeProvider';
import logoLight from '@/assets/logo.png';
import logoDark from '@/assets/logo-dark.png';

const NOTIF_KEY = 'defyshare:notifications';

const Index = () => {
  const { theme } = useTheme();
  const { publicIP, roomId } = usePublicIP();
  const { files, loading: filesLoading, uploadState, addFiles, removeFile, downloadFile, clearAll, cancelUpload, retryUpload, dismissUploads } = useFileSharing(roomId);
  const { texts, loading: textsLoading, addText, removeText, clearAllTexts } = useTextSharing(roomId);
  const onlineCount = useOnlinePresence(roomId);
  const { user } = useAuth();
  const { keepForever, overrideSeconds, durationChosen } = usePromoOverride();
  const { toast } = useToast();

  const [previewFile, setPreviewFile] = useState<SharedFile | null>(null);

  const logo = theme === 'dark' ? logoDark : logoLight;

  const notificationsEnabled = () =>
    typeof window === 'undefined' || localStorage.getItem(NOTIF_KEY) !== 'false';

  const defaultUploaderName =
    (user?.user_metadata?.full_name as string) || user?.email?.split('@')[0] || 'Anonymous';

  const uploadBatch = async (incoming: File[]) => {
    if (incoming.length === 0) return;
    try {
      const result = await addFiles(incoming, {
        uploader_name: defaultUploaderName,
        uploader_email: user?.email ?? null,
        uploader_id: user?.id ?? null,
        keep_forever: keepForever && durationChosen,
        expires_seconds: keepForever && durationChosen ? overrideSeconds : undefined,
      });
      if (notificationsEnabled()) {
        if (result.failed > 0) {
          toast({
            title: `${result.ok} uploaded, ${result.failed} failed`,
            description: 'Some files could not be shared',
            variant: 'destructive',
          });
        } else {
          toast({
            title: incoming.length === 1 ? 'File shared' : `${result.ok} files shared`,
            description: 'Available on this network',
          });
        }
      }
    } catch {
      toast({ title: 'Upload failed', description: 'Could not share the files', variant: 'destructive' });
    }
  };

  // Global paste: upload pasted files
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const data = e.clipboardData;
      if (!data) return;
      const files = Array.from(data.files || []);
      if (files.length === 0) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const text = data.getData('text');
      if (text && (tag === 'TEXTAREA' || tag === 'INPUT')) return;
      e.preventDefault();
      uploadBatch(files);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultUploaderName, keepForever, overrideSeconds, durationChosen]);

  const handleClearAllFiles = async () => {
    await clearAll();
    toast({ title: 'Files cleared', description: 'All files have been removed' });
  };

  const handleClearAllTexts = async () => {
    await clearAllTexts();
    toast({ title: 'Texts cleared', description: 'All texts have been removed' });
  };

  const totalItems = files.length + texts.length;

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none" />
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="relative max-w-2xl mx-auto px-3 sm:px-4 py-6 sm:py-8 md:py-12 w-full">
        <header className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between gap-2 mb-4 w-full min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <img src={logo} alt="DefyShare Logo" className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 shrink-0" />
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight truncate">
                Defy<span className="text-primary text-glow">Share</span>
              </h1>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <OnlineIndicator count={onlineCount} />
              <ThemeToggle />
              <SettingsSheet />
              <AuthButton />
            </div>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm">Real-time file & text sharing • Auto-rooms by network</p>
        </header>


        <div className="mb-6 animate-fade-in">
          <RoomInfo localIP={publicIP} roomId={roomId} fileCount={totalItems} />
        </div>

        <Tabs defaultValue="files" className="animate-fade-in" style={{ animationDelay: '100ms' }}>
          <TabsList className="grid w-full grid-cols-2 bg-secondary/50 border border-border/50">
            <TabsTrigger value="files" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <FileIcon className="w-4 h-4" />
              Files
              {files.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary/20 text-primary">{files.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="text" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <MessageSquareText className="w-4 h-4" />
              Text
              {texts.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary/20 text-primary">{texts.length}</span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="files" className="mt-6 space-y-6">
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

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Shared Files</h2>
                {files.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => files.forEach((f) => downloadFile(f))}
                      className="text-muted-foreground hover:text-primary"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download all
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearAllFiles}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear all
                    </Button>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm p-4">
                <FileList
                  files={files}
                  loading={filesLoading}
                  onDownload={downloadFile}
                  onRemove={removeFile}
                  onPreview={setPreviewFile}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="text" className="mt-6">
            <div className="rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm p-4">
              <TextShare
                texts={texts}
                loading={textsLoading}
                onAdd={addText}
                onRemove={removeText}
                onClearAll={handleClearAllTexts}
              />
            </div>
          </TabsContent>
        </Tabs>

        <section className="mt-16 space-y-8 text-sm leading-relaxed">
          <div>
            <h2 className="text-xl font-semibold mb-2">Share files between your devices in seconds</h2>
            <p className="text-muted-foreground">DefyShare lets you move photos, documents, videos, folders and text between your phone, laptop and tablet without cables, email or sign-up. Open this page on every device connected to the same Wi-Fi and they join the same private room automatically.</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">How to use DefyShare</h2>
            <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
              <li>Open defyshare.app on two or more devices on the same network.</li>
              <li>Drop files or a whole folder into the box above, or paste them with Ctrl+V.</li>
              <li>They appear instantly on your other devices — tap to preview or download.</li>
              <li>Items delete themselves automatically after about 30 hours.</li>
            </ol>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">Frequently asked questions</h2>
            <h3 className="font-medium mt-3">Do I need an account?</h3>
            <p className="text-muted-foreground">No. Signing in with Google is optional and only adds your name to files you share.</p>
            <h3 className="font-medium mt-3">Who can see my files?</h3>
            <p className="text-muted-foreground">Only devices on the same network, which share your room. Other networks never see them.</p>
            <h3 className="font-medium mt-3">Does it work on iPhone and Android?</h3>
            <p className="text-muted-foreground">Yes — it runs in any modern browser on Windows, macOS, Linux, Android, iOS and ChromeOS, and can be installed as an app.</p>
            <h3 className="font-medium mt-3">Can I send folders?</h3>
            <p className="text-muted-foreground">Yes. Drag a folder in and every file inside uploads in parallel with per-file progress.</p>
          </div>
        </section>

        <footer className="mt-12 text-center text-xs text-muted-foreground space-y-2">
          <nav className="flex flex-wrap justify-center gap-x-4 gap-y-1">
            <a href="/about" className="hover:text-primary">About</a>
            <a href="/privacy" className="hover:text-primary">Privacy</a>
            <a href="/terms" className="hover:text-primary">Terms</a>
            <a href="/contact" className="hover:text-primary">Contact</a>
            <a href="/press" className="hover:text-primary">Press</a>
          </nav>
          <p>Real-time sync powered by DefyScale</p>
        </footer>
      </div>

      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />

      <GlobalDropOverlay
        onDrop={async (dt) => {
          const files = await collectFilesFromDataTransfer(dt);
          uploadBatch(files);
        }}
      />
    </div>
  );
};

export default Index;
