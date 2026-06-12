import React, { useEffect, useState } from 'react';
import { Trash2, FileIcon, MessageSquareText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DropZone from '@/components/DropZone';
import FileList from '@/components/FileList';
import RoomInfo from '@/components/RoomInfo';
import TextShare from '@/components/TextShare';
import ThemeToggle from '@/components/ThemeToggle';
import OnlineIndicator from '@/components/OnlineIndicator';
import UploadProgress from '@/components/UploadProgress';
import UploadMetadataModal from '@/components/UploadMetadataModal';
import AuthButton from '@/components/AuthButton';
import SettingsSheet from '@/components/SettingsSheet';
import FilePreviewModal from '@/components/FilePreviewModal';
import GlobalDropOverlay from '@/components/GlobalDropOverlay';
import { usePublicIP } from '@/hooks/usePublicIP';
import { useFileSharing, SharedFile } from '@/hooks/useFileSharing';
import { useTextSharing } from '@/hooks/useTextSharing';
import { useOnlinePresence } from '@/hooks/useOnlinePresence';
import { useAuth } from '@/hooks/useAuth';
import { useProfileSync } from '@/hooks/useProfileSync';
import { FriendsNavButton } from '@/components/FriendsNavButton';
import { usePromoOverride } from '@/hooks/usePromoOverride';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/components/ThemeProvider';
import logoLight from '@/assets/logo.png';
import logoDark from '@/assets/logo-dark.png';

const NOTIF_KEY = 'defyshare:notifications';

const Index = () => {
  const { theme } = useTheme();
  const { publicIP, roomId } = usePublicIP();
  const { files, loading: filesLoading, uploadState, addFile, removeFile, downloadFile, clearAll } = useFileSharing(roomId);
  const { texts, loading: textsLoading, addText, removeText, clearAllTexts } = useTextSharing(roomId);
  const onlineCount = useOnlinePresence(roomId);
  const { user } = useAuth();
  const { keepForever, overrideSeconds, durationChosen } = usePromoOverride();
  const { toast } = useToast();

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<SharedFile | null>(null);

  const logo = theme === 'dark' ? logoDark : logoLight;

  const notificationsEnabled = () =>
    typeof window === 'undefined' || localStorage.getItem(NOTIF_KEY) !== 'false';

  const handleFileDrop = async (file: File) => setPendingFile(file);

  // Global paste handler: upload pasted files (Ctrl/Cmd+V).
  // If clipboard contains only text, let the default paste happen (e.g., in textareas).
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const data = e.clipboardData;
      if (!data) return;
      const files = Array.from(data.files || []);
      if (files.length === 0) return; // text-only paste → let it through
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const text = data.getData('text');
      // If user is typing in a textarea/input and clipboard also has text, prefer text paste.
      if (text && (tag === 'TEXTAREA' || tag === 'INPUT')) return;
      e.preventDefault();
      setPendingFile(files[0]);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, []);


  const handleMetadataSubmit = async (data: { uploader_name: string; subject: string }) => {
    const file = pendingFile;
    setPendingFile(null);
    if (!file) return;
    try {
      await addFile(file, {
        uploader_name: data.uploader_name,
        subject: data.subject,
        uploader_email: user?.email ?? null,
        uploader_id: user?.id ?? null,
        keep_forever: keepForever && durationChosen,
        expires_seconds: keepForever && durationChosen ? overrideSeconds : undefined,
      });
      if (notificationsEnabled()) {
        toast({
          title: 'File shared',
          description: `${data.subject} is now available on this network`,
        });
      }
    } catch {
      toast({
        title: 'Upload failed',
        description: 'Could not share the file',
        variant: 'destructive',
      });
    }
  };

  const handleClearAllFiles = async () => {
    await clearAll();
    toast({ title: 'Files cleared', description: 'All files have been removed' });
  };

  const handleClearAllTexts = async () => {
    await clearAllTexts();
    toast({ title: 'Texts cleared', description: 'All texts have been removed' });
  };

  const totalItems = files.length + texts.length;
  const defaultUploaderName = (user?.user_metadata?.full_name as string) || user?.email?.split('@')[0] || '';

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none" />
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 py-8 md:py-12">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <img src={logo} alt="DefyShare Logo" className="w-10 h-10 md:w-12 md:h-12" />
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Defy<span className="text-primary text-glow">Share</span>
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <OnlineIndicator count={onlineCount} />
              <ThemeToggle />
              <SettingsSheet />
              <AuthButton />
            </div>
          </div>
          <p className="text-muted-foreground text-sm">
            Real-time file & text sharing • Auto-rooms by network
          </p>
        </header>

        <div className="mb-6 animate-fade-in">
          <RoomInfo localIP={publicIP} roomId={roomId} fileCount={totalItems} />
        </div>

        <Tabs defaultValue="files" className="animate-fade-in" style={{ animationDelay: '100ms' }}>
          <TabsList className="grid w-full grid-cols-2 bg-secondary/50 border border-border/50">
            <TabsTrigger
              value="files"
              className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
            >
              <FileIcon className="w-4 h-4" />
              Files
              {files.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary/20 text-primary">
                  {files.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="text"
              className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
            >
              <MessageSquareText className="w-4 h-4" />
              Text
              {texts.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary/20 text-primary">
                  {texts.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="files" className="mt-6 space-y-6">
            <DropZone onFileDrop={handleFileDrop} isUploading={uploadState.isUploading} />

            {uploadState.isUploading && (
              <UploadProgress progress={uploadState.progress} fileName={uploadState.fileName} />
            )}

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Shared Files</h2>
                {files.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAllFiles}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear all
                  </Button>
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

        <footer className="mt-12 text-center text-xs text-muted-foreground">
          <p>Real-time sync powered by defyscale</p>
        </footer>
      </div>

      <UploadMetadataModal
        file={pendingFile}
        open={!!pendingFile}
        defaultName={defaultUploaderName}
        onCancel={() => setPendingFile(null)}
        onSubmit={handleMetadataSubmit}
      />

      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />

      <GlobalDropOverlay onFiles={(files) => setPendingFile(files[0])} />

    </div>
  );
};

export default Index;
