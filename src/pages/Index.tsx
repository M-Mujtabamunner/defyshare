import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Trash2, FileIcon, MessageSquareText, Download, ChevronDown, Users } from 'lucide-react';
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
import AppearanceMenu from '@/components/AppearanceMenu';
import { useTheme } from '@/components/ThemeProvider';
import FilePreviewModal from '@/components/FilePreviewModal';
import UploadAnywhere from '@/components/UploadAnywhere';
import MemberPicker, { TargetLabel } from '@/components/MemberPicker';
import DeviceName from '@/components/DeviceName';
import GroupsSheet from '@/components/GroupsSheet';
import InvitesButton from '@/components/InvitesButton';
import InstallButton from '@/components/InstallButton';
import LanguageMenu from '@/components/LanguageMenu';
import { NotificationsBell, NotificationStack } from '@/components/NotificationsBell';
import { usePublicIP } from '@/hooks/usePublicIP';
import { useFileSharing, SharedFile } from '@/hooks/useFileSharing';
import { useTextSharing } from '@/hooks/useTextSharing';
import { useRoomMembers } from '@/hooks/useOnlinePresence';
import { useGroups, type GroupEvent, type Invite } from '@/hooks/useGroups';
import { useNotifications } from '@/hooks/useNotifications';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { useDevice } from '@/lib/deviceIdentity';
import { EVERYONE, type Peer, type Target } from '@/lib/recipients';
import { useT } from '@/lib/i18n';
import logoMark from '@/assets/logo-mark.png';
import classicLogoLight from '@/assets/logo.png';
import classicLogoDark from '@/assets/logo-dark.png';
import { HOME_FAQ } from '@/data/homeFaq';
import { PoweredByBadge } from '@/components/PoweredByBadge';

const CONFIRMATIONS_KEY = 'defyshare:notifications';

const confirmationsEnabled = () => {
  try {
    return localStorage.getItem(CONFIRMATIONS_KEY) !== 'false';
  } catch {
    return true;
  }
};

const fileLabel = (file: SharedFile) => file.name.split('/').pop() || file.name;

const Index = () => {
  const { t } = useT();
  const { design, resolved } = useTheme();
  const logo = design === 'classic' ? (resolved === 'dark' ? classicLogoDark : classicLogoLight) : logoMark;
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const device = useDevice();
  const me = useMemo<Peer>(() => ({ id: device.id, name: device.name }), [device.id, device.name]);
  const { publicIP, roomId, verified } = usePublicIP();
  const { members, onlineCount, otherNames, remember } = useRoomMembers(roomId, me);
  const notifications = useNotifications();
  const { push } = notifications;

  // --- Groups & invitations ---
  const onGroupEvent = useCallback(
    (e: GroupEvent) => {
      if (e.type === 'invited') {
        push({ id: `invite:${e.invite.id}`, kind: 'invite', title: t('nInvited', { name: e.invite.from.name, group: e.invite.groupName }) });
      } else if (e.type === 'joined') {
        push({ id: `joined:${e.eventId}`, kind: 'joined', title: t('nJoined', { name: e.who.name, group: e.groupName }) });
      } else {
        push({ id: `removed:${e.eventId}`, kind: 'removed', title: t('nRemoved', { group: e.groupName }) });
      }
    },
    [push, t],
  );
  const groupsApi = useGroups(roomId, me, onGroupEvent);
  const { groups, myGroupIds, invites } = groupsApi;
  const [groupsOpen, setGroupsOpen] = useState(false);

  // --- Files ---
  const onIncoming = useCallback(
    (file: SharedFile, from: Peer | null, target: Target) =>
      push({
        id: `file:${file.id}`,
        kind: 'file',
        title:
          target.kind === 'group'
            ? t('nSentGroup', { name: from?.name ?? t('someone'), file: fileLabel(file), group: target.group.name })
            : t('nSentYou', { name: from?.name ?? t('someone'), file: fileLabel(file) }),
      }),
    [push, t],
  );
  const {
    files,
    allFiles,
    loading: filesLoading,
    uploadState,
    addFiles,
    removeFile,
    downloadFile,
    clearAll,
    cancelUpload,
    retryUpload,
    dismissUploads,
    changeTarget,
  } = useFileSharing(roomId, device.id, myGroupIds, onIncoming);
  const { texts, loading: textsLoading, addText, removeText, clearAllTexts } = useTextSharing(roomId);

  const [previewFile, setPreviewFile] = useState<SharedFile | null>(null);
  const [tab, setTab] = useState('files');
  const [target, setTarget] = useState<Target>(EVERYONE);
  const pendingRef = useRef<File[]>([]);

  // Keep the chosen audience current: live device names, and drop a group you've left.
  const liveTarget = useMemo<Target>(() => {
    if (target.kind === 'devices') {
      return { kind: 'devices', devices: target.devices.map((d) => ({ id: d.id, name: members.find((m) => m.id === d.id)?.name ?? d.name })) };
    }
    if (target.kind === 'group') {
      const g = groups.find((x) => x.id === target.group.id);
      return g ? { kind: 'group', group: { id: g.id, name: g.name } } : EVERYONE;
    }
    return target;
  }, [target, members, groups]);

  // An auto-picked name that clashes with another online device gets re-rolled.
  useEffect(() => {
    if (otherNames.length > 0) device.avoidNames(otherNames);
  }, [otherNames, device]);

  // Devices that shared files are remembered even after they go offline.
  useEffect(() => {
    remember(
      allFiles
        .filter((f) => f.uploader_id && f.uploader_name)
        .map((f) => ({ id: f.uploader_id as string, name: f.uploader_name as string, at: new Date(f.created_at).getTime() })),
    );
  }, [allFiles, remember]);

  const uploadBatch = useCallback(
    async (incoming: File[]) => {
      if (incoming.length === 0) return;
      setTab('files');
      // Wait for the network check so files never land in a stale room.
      if (!verified) {
        pendingRef.current.push(...incoming);
        return;
      }
      const result = await addFiles(incoming, { sender: me, target: liveTarget });
      if (result.failed > 0) {
        toast({ title: t('nOfTotalFailed', { n: result.failed, total: incoming.length }), variant: 'destructive' });
      } else if (confirmationsEnabled()) {
        const name =
          liveTarget.kind === 'devices'
            ? liveTarget.devices.length > 1
              ? t('peopleAndMore', { name: liveTarget.devices[0].name, n: liveTarget.devices.length - 1 })
              : liveTarget.devices[0].name
            : liveTarget.kind === 'group'
              ? liveTarget.group.name
              : null;
        toast({
          title: name
            ? incoming.length === 1
              ? t('fileSentTo', { name })
              : t('nFilesSentTo', { n: result.ok, name })
            : incoming.length === 1
              ? t('fileShared1')
              : t('nFilesShared', { n: result.ok }),
        });
      }
    },
    [verified, addFiles, me, liveTarget, toast, t],
  );

  const onChangeTarget = useCallback(
    async (file: SharedFile, next: Target) => {
      try {
        await changeTarget(file, next);
        const name = next.kind === 'devices' ? next.devices.map((d) => d.name).join(', ') : next.kind === 'group' ? next.group.name : null;
        toast({ title: name ? t('nowSentTo', { name }) : t('nowEveryone') });
      } catch {
        toast({ title: t('changeFailed'), variant: 'destructive' });
      }
    },
    [changeTarget, toast, t],
  );

  const onCreateGroup = useCallback(
    async (name: string, people: Peer[]) => {
      await groupsApi.createGroup(name, people);
      toast({ title: t('groupCreated') });
    },
    [groupsApi, toast, t],
  );

  const onAcceptInvite = useCallback(
    async (inv: Invite) => {
      await groupsApi.acceptInvite(inv);
      toast({ title: t('joinedGroup', { group: inv.groupName }) });
    },
    [groupsApi, toast, t],
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
    const timer = setTimeout(dismissUploads, 2500);
    return () => clearTimeout(timer);
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
    n > 0 && <span className="px-1.5 py-px text-[11px] rounded-full bg-primary/15 text-primary tabular-nums">{n}</span>;

  const groupActions = useMemo(
    () => ({
      createGroup: groupsApi.createGroup,
      renameGroup: groupsApi.renameGroup,
      invite: groupsApi.invite,
      removeMember: groupsApi.removeMember,
      cancelInvite: groupsApi.cancelInvite,
      leaveGroup: groupsApi.leaveGroup,
      deleteGroup: groupsApi.deleteGroup,
    }),
    [groupsApi],
  );

  return (
    <div className="min-h-screen bg-background" data-upload-surface>
      {/* Classic design's background glow (hidden in the current design) */}
      <div className="classic-only fixed inset-0 pointer-events-none" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background" />
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* App-style header: stays at the top while you scroll */}
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-md border-b border-border/50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-2xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-0.5 sm:gap-1.5 min-w-0">
            <AppearanceMenu />
            <a href="/" className="flex items-center gap-2 shrink-0" aria-label="DefyShare">
              <img src={logo} alt="DefyShare logo" width={36} height={36} className="w-8 h-8 sm:w-9 sm:h-9 rounded-[9px] shrink-0" />
              <span className="hidden min-[360px]:inline text-lg sm:text-xl font-bold tracking-tight">
                Defy<span className="text-primary text-glow">Share</span>
              </span>
            </a>
          </div>
          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            <InstallButton className="hidden md:inline-flex me-1" />
            <OnlineIndicator count={onlineCount} />
            <LanguageMenu className="hidden md:grid" />
            <InvitesButton invites={invites} onAccept={onAcceptInvite} onDecline={groupsApi.declineInvite} />
            <NotificationsBell
              items={notifications.items}
              unread={notifications.unread}
              onOpen={notifications.markAllRead}
              onClear={notifications.clear}
            />
            <SettingsSheet />
          </div>
        </div>
      </header>

      <div className="relative mx-auto w-full px-3 sm:px-4" data-upload-surface>
        <main className="w-full max-w-2xl mx-auto pt-4 pb-6 sm:pt-6" data-upload-surface>
          <h1 className="mb-4 text-sm sm:text-[15px] text-muted-foreground">{t('tagline')}</h1>

          <div className="mb-4">
            <RoomInfo
              localIP={publicIP}
              roomId={roomId}
              fileCount={files.length + texts.length}
              footer={<DeviceName id={device.id} name={device.name} onRename={device.rename} />}
            />
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full h-11 grid-cols-2 bg-secondary/70 border border-border/60">
              <TabsTrigger value="files" className="gap-2 h-9 data-[state=active]:bg-card data-[state=active]:text-primary">
                <FileIcon className="w-4 h-4" />
                {t('files')}
                {countBadge(files.length)}
              </TabsTrigger>
              <TabsTrigger value="text" className="gap-2 h-9 data-[state=active]:bg-card data-[state=active]:text-primary">
                <MessageSquareText className="w-4 h-4" />
                {t('text')}
                {countBadge(texts.length)}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="files" className="mt-3 space-y-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-medium text-muted-foreground shrink-0">{t('sendTo')}</span>
                <MemberPicker
                  members={members}
                  groups={groups}
                  value={liveTarget}
                  onChange={setTarget}
                  onCreateGroup={onCreateGroup}
                  onManageGroups={() => setGroupsOpen(true)}
                >
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 min-w-[7.5rem] max-w-full h-9 rounded-full border border-border bg-card ps-1.5 pe-2.5 text-sm hover:border-primary/50 transition-colors"
                  >
                    <TargetLabel target={liveTarget} />
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  </button>
                </MemberPicker>
                <button
                  type="button"
                  onClick={() => setGroupsOpen(true)}
                  aria-label={t('groups')}
                  className="ms-auto inline-flex items-center justify-center gap-1.5 h-9 min-w-9 rounded-full px-2.5 sm:px-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
                >
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('groups')}</span>
                </button>
              </div>

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
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-xs font-medium text-muted-foreground min-w-0 truncate">
                    {t('nShared', { n: files.length })}
                    <span className="hidden sm:inline"> · {t('autoDeleted')}</span>
                  </h2>
                  <div className="flex items-center shrink-0">
                    <Button variant="ghost" size="sm" onClick={downloadAll} className="h-8 gap-1 text-xs text-muted-foreground hover:text-primary">
                      <Download className="w-3.5 h-3.5" />
                      {t('downloadAll')}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={clearAll} className="h-8 gap-1 text-xs text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                      {t('clearAll')}
                    </Button>
                  </div>
                </div>
              )}

              <FileList
                files={files}
                loading={filesLoading}
                deviceId={device.id}
                members={members}
                groups={groups}
                onDownload={(f) => downloadFile(f).catch(() => toast({ title: t('downloadFailed'), variant: 'destructive' }))}
                onRemove={removeFile}
                onPreview={setPreviewFile}
                onChangeTarget={onChangeTarget}
                onCreateGroup={onCreateGroup}
                onManageGroups={() => setGroupsOpen(true)}
              />
            </TabsContent>

            <TabsContent value="text" className="mt-3">
              <TextShare texts={texts} loading={textsLoading} onAdd={addText} onRemove={removeText} onClearAll={clearAllTexts} />
            </TabsContent>
          </Tabs>

          <section className="mt-12 space-y-7 text-sm leading-relaxed" lang="en" dir="ltr">
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
                <li>Pick who gets them — everyone, one or more devices, or a group — and they arrive instantly.</li>
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

          <footer className="mt-8 pb-16 text-center text-xs text-muted-foreground space-y-2">
            <nav className="flex flex-wrap justify-center gap-x-4 gap-y-1">
              <a href="/about" className="hover:text-primary">About</a>
              <a href="/privacy" className="hover:text-primary">Privacy</a>
              <a href="/terms" className="hover:text-primary">Terms</a>
              <a href="/contact" className="hover:text-primary">Contact</a>
              <a href="/press" className="hover:text-primary">Press</a>
            </nav>
            <p>© {new Date().getFullYear()} DefyShare</p>
            <div className="md:hidden pt-2">
              <PoweredByBadge inline />
            </div>
          </footer>
        </main>
      </div>

      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />

      <GroupsSheet
        open={groupsOpen}
        onOpenChange={setGroupsOpen}
        groups={groups}
        members={members}
        meId={device.id}
        actions={groupActions}
        onInvited={() => toast({ title: t('invitesSent') })}
      />

      {/* Phones get a sound and the red count only; desktops also get slide-in cards. */}
      {!isMobile && <NotificationStack items={notifications.fresh} onDismiss={notifications.dismissFresh} />}

      <UploadAnywhere
        onFiles={uploadBatch}
        onDrop={async (dt) => uploadBatch(await collectFilesFromDataTransfer(dt))}
        disabled={uploadState.isUploading}
      />
    </div>
  );
};

export default Index;
