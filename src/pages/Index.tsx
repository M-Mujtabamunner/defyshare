import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Download, Trash2 } from 'lucide-react';
import { collectFilesFromDataTransfer } from '@/lib/dropFiles';
import FileList from '@/components/FileList';
import { RoomBar, RoomPanel } from '@/components/RoomPanel';
import ShareStage, { type StageTab } from '@/components/ShareStage';
import ShareLinkDialog from '@/components/ShareLinkDialog';
import TextShare from '@/components/TextShare';
import UploadProgressList from '@/components/UploadProgressList';
import SettingsSheet from '@/components/SettingsSheet';
import AuthButton from '@/components/AuthButton';
import { PlanCards, PlansDialog } from '@/components/PlanCards';
import { usePlan } from '@/hooks/usePlan';
import { formatLimit, planFor } from '@/lib/plans';
import { ThemeToggle } from '@/components/AppearanceMenu';
import { useTheme } from '@/components/ThemeProvider';
import FilePreviewModal from '@/components/FilePreviewModal';
import UploadAnywhere from '@/components/UploadAnywhere';
import MemberPicker, { TargetLabel } from '@/components/MemberPicker';
import GroupsSheet from '@/components/GroupsSheet';
import InvitesButton from '@/components/InvitesButton';
import InstallButton from '@/components/InstallButton';
import { NotificationsBell, NotificationStack } from '@/components/NotificationsBell';
import { usePublicIP } from '@/hooks/usePublicIP';
import { useFileSharing, SharedFile } from '@/hooks/useFileSharing';
import { useTextSharing, type SharedText } from '@/hooks/useTextSharing';
import { useRoomMembers, type Member } from '@/hooks/useOnlinePresence';
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
import { mockFiles, mockMembers, mockTexts } from '@/dev/mockRoom';

// `npm run dev` only: /?mock fills the room with sample items so the layout can be checked.
const MOCK = import.meta.env.DEV && new URLSearchParams(window.location.search).has('mock');

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
  const room = useRoomMembers(roomId, me);
  const { otherNames, remember } = room;
  const members = MOCK ? mockMembers : room.members;
  const onlineCount = MOCK ? 3 : room.onlineCount;
  const notifications = useNotifications();
  const { plan, limit: planLimit, setPlansOpen } = usePlan();
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
    files: roomFiles,
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
  const onIncomingText = useCallback(
    (text: SharedText) =>
      push({ id: `text:${text.id}`, kind: 'file', title: t('nSentYouText', { name: text.from?.name ?? t('someone') }) }),
    [push, t],
  );
  const { texts: roomTexts, loading: textsLoading, addText, removeText, clearAllTexts } = useTextSharing(roomId, device.id, myGroupIds, onIncomingText);
  const files = useMemo(() => (MOCK ? mockFiles(device.id, device.name) : roomFiles), [roomFiles, device.id, device.name]);
  const texts = useMemo(() => (MOCK ? mockTexts(device.id, device.name) : roomTexts), [roomTexts, device.id, device.name]);

  const [preview, setPreview] = useState<{ file: SharedFile; list: SharedFile[] } | null>(null);
  const [shareFile, setShareFile] = useState<SharedFile | null>(null);
  const [tab, setTab] = useState<StageTab>('files');
  const [target, setTarget] = useState<Target>(EVERYONE);
  const pendingRef = useRef<{ files: File[]; to?: Target }[]>([]);

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
    async (picked: File[], to?: Target) => {
      if (picked.length === 0) return;
      const audience = to ?? liveTarget;
      // Files over the plan's limit are skipped, with a way to upgrade.
      const tooBig = picked.filter((f) => f.size > planLimit);
      if (tooBig.length > 0) {
        const need = planFor(Math.max(...tooBig.map((f) => f.size)));
        toast({
          title:
            tooBig.length === 1
              ? `"${tooBig[0].name}" is over ${formatLimit(planLimit)}`
              : `${tooBig.length} files are over ${formatLimit(planLimit)}`,
          description: need
            ? `Upgrade to ${need.name} to send files up to ${formatLimit(need.limit)}.`
            : "Files over 3 GB can't be sent yet.",
          variant: 'destructive',
        });
        if (need) setPlansOpen(true);
      }
      const incoming = picked.filter((f) => f.size <= planLimit);
      if (incoming.length === 0) return;
      setTab('files');
      // Wait for the network check so files never land in a stale room.
      if (!verified) {
        pendingRef.current.push({ files: incoming, to });
        return;
      }
      const result = await addFiles(incoming, { sender: me, target: audience });
      if (result.failed > 0) {
        toast({ title: t('nOfTotalFailed', { n: result.failed, total: incoming.length }), variant: 'destructive' });
      } else if (confirmationsEnabled()) {
        const name =
          audience.kind === 'devices'
            ? audience.devices.length > 1
              ? t('peopleAndMore', { name: audience.devices[0].name, n: audience.devices.length - 1 })
              : audience.devices[0].name
            : audience.kind === 'group'
              ? audience.group.name
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
    [verified, addFiles, me, liveTarget, toast, t, planLimit, setPlansOpen],
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
      queued.forEach((q) => uploadBatch(q.files, q.to));
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

  const download = useCallback(
    (f: SharedFile) => downloadFile(f).catch(() => toast({ title: t('downloadFailed'), variant: 'destructive' })),
    [downloadFile, toast, t],
  );

  /** Tapping a device in the room sends to just that device; tapping it again goes back to everyone. */
  const pickDevice = useCallback((m: Member) => {
    setTarget((cur) =>
      cur.kind === 'devices' && cur.devices.length === 1 && cur.devices[0].id === m.id ? EVERYONE : { kind: 'devices', devices: [{ id: m.id, name: m.name }] },
    );
  }, []);

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

  const roomProps = {
    publicIP,
    me,
    onRename: device.rename,
    members,
    target: liveTarget,
    onPickDevice: pickDevice,
    onOpenGroups: () => setGroupsOpen(true),
    groupCount: groups.length,
  };

  const onlineDevices = members.filter((m) => m.online);

  return (
    <div className="min-h-screen bg-background" data-upload-surface>
      {/* Classic design's background glow (hidden in the current design) */}
      <div className="classic-only fixed inset-0 pointer-events-none" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background" />
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
      </div>

      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-md" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
          <a href="/" className="flex items-center gap-2.5 shrink-0" aria-label="DefyShare">
            <img src={logo} alt="DefyShare logo" width={36} height={36} className="w-8 h-8 rounded-[9px] shrink-0" />
            <span className="hidden min-[360px]:inline text-[19px] font-semibold tracking-tight">DefyShare</span>
          </a>
          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            <InstallButton className="hidden md:inline-flex me-1.5" />
            <InvitesButton invites={invites} onAccept={onAcceptInvite} onDecline={groupsApi.declineInvite} />
            <NotificationsBell
              items={notifications.items}
              unread={notifications.unread}
              onOpen={notifications.markAllRead}
              onClear={notifications.clear}
            />
            <ThemeToggle className="hidden sm:grid" />
            <SettingsSheet />
            <AuthButton />
          </div>
        </div>
      </header>

      <div className="relative mx-auto w-full max-w-5xl px-4 sm:px-6" data-upload-surface>
        <main className="pt-2 sm:pt-4 pb-6" data-upload-surface>
          <h1 className="max-w-xl text-[15px] leading-relaxed text-muted-foreground">{t('tagline')}</h1>

          <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18.5rem] lg:items-start" data-upload-surface>
            <div className="min-w-0 flex flex-col gap-4" data-upload-surface>
              <div className="lg:hidden">
                <RoomBar {...roomProps} onlineCount={onlineCount} />
              </div>

              <ShareStage
                tab={tab}
                onTabChange={setTab}
                fileCount={files.length}
                textCount={texts.length}
                devices={onlineDevices}
                onFiles={uploadBatch}
                onText={(content) => addText(content, me, liveTarget)}
                isUploading={uploadState.isUploading}
                audience={
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
                      className="inline-flex items-center gap-1.5 min-w-0 max-w-full h-10 rounded-full border border-border bg-card ps-2 pe-3 text-sm hover:border-foreground/30 transition-colors"
                    >
                      <TargetLabel target={liveTarget} />
                      <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                    </button>
                  </MemberPicker>
                }
                limitNote={
                  <>
                    {t('upToPerFile', { size: formatLimit(planLimit) })}
                    {plan !== 'pro' && (
                      <>
                        {'. '}
                        <button type="button" onClick={() => setPlansOpen(true)} className="font-medium text-foreground underline underline-offset-4 decoration-border hover:decoration-foreground">
                          {t('sendBigger')}
                        </button>
                      </>
                    )}
                  </>
                }
              />

              {uploadState.items.length > 0 && (
                <UploadProgressList
                  items={uploadState.items}
                  aggregate={uploadState.progress}
                  totalFiles={uploadState.totalFiles}
                  completedFiles={uploadState.completedFiles}
                  onCancel={cancelUpload}
                  onRetry={retryUpload}
                  onDismiss={!uploadState.isUploading ? dismissUploads : undefined}
                />
              )}

              {tab === 'files' ? (
                <div className="space-y-3 pt-2">
                  {files.length > 0 && (
                    <div className="flex items-center justify-between gap-2 min-h-9">
                      <h2 className="text-sm text-muted-foreground min-w-0 truncate">
                        {t('nShared', { n: files.length })}
                        <span className="hidden sm:inline">, {t('autoDeleted')}</span>
                      </h2>
                      <div className="flex items-center shrink-0">
                        <button
                          type="button"
                          onClick={downloadAll}
                          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          {t('downloadAll')}
                        </button>
                        <button
                          type="button"
                          onClick={clearAll}
                          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          {t('clearAll')}
                        </button>
                      </div>
                    </div>
                  )}

                  <FileList
                    files={files}
                    loading={filesLoading && !MOCK}
                    deviceId={device.id}
                    members={members}
                    groups={groups}
                    onDownload={download}
                    onRemove={removeFile}
                    onPreview={(file, list) => setPreview({ file, list })}
                    onShare={setShareFile}
                    onChangeTarget={onChangeTarget}
                    onCreateGroup={onCreateGroup}
                    onManageGroups={() => setGroupsOpen(true)}
                  />
                </div>
              ) : (
                <div className="pt-2">
                  <TextShare texts={texts} loading={textsLoading && !MOCK} deviceId={device.id} onRemove={removeText} onClearAll={clearAllTexts} />
                </div>
              )}
            </div>

            <aside className="hidden lg:block lg:sticky lg:top-20">
              <RoomPanel {...roomProps} />
            </aside>
          </div>

          <section id="plans" className="mt-20 scroll-mt-24">
            <h2 className="text-2xl font-medium tracking-tight">Send bigger files</h2>
            <p className="mt-1.5 mb-6 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
              Pick a plan, sign in with Google and pay securely with Lemon Squeezy.
            </p>
            <PlanCards />
          </section>
          <PlansDialog />

          <section className="mt-20 grid gap-x-12 gap-y-14 lg:grid-cols-2 text-[15px] leading-relaxed" lang="en" dir="ltr">
            <div className="space-y-12">
              <div>
                <h2 className="text-2xl font-medium tracking-tight mb-3">Share files between your devices in seconds</h2>
                <p className="text-muted-foreground">
                  DefyShare moves photos, videos, documents, archives, folders and text between your phone, laptop and tablet without
                  cables, email or sign-up. Open this page on every device connected to the same Wi-Fi and they join the same
                  private room automatically.
                </p>
              </div>
              <div>
                <h2 className="text-2xl font-medium tracking-tight mb-4">How to use DefyShare</h2>
                <ol className="space-y-3.5">
                  {[
                    'Open defyshare.app on two or more devices on the same network.',
                    'Drop files or a folder onto the page, click anywhere to pick files, or paste with Ctrl+V.',
                    'Pick who gets them — everyone, one or more devices, or a group — and they arrive instantly.',
                    'Everything is deleted automatically after 3 hours.',
                  ].map((step, i) => (
                    <li key={step} className="flex gap-3.5">
                      <span className="grid place-items-center w-7 h-7 rounded-full border border-border bg-card text-sm font-medium tabular-nums shrink-0">
                        {i + 1}
                      </span>
                      <span className="pt-0.5 text-muted-foreground">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-medium tracking-tight mb-2">Frequently asked questions</h2>
              <div className="divide-y divide-border border-b border-border">
                {HOME_FAQ.map(({ q, a }) => (
                  <details key={q} className="group py-1">
                    <summary className="flex items-center justify-between gap-4 py-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                      <h3 className="font-medium">{q}</h3>
                      <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 transition-transform group-open:rotate-180" />
                    </summary>
                    <p className="pb-4 pe-8 text-muted-foreground">{a}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>

          <footer className="mt-20 pt-6 pb-16 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} DefyShare</p>
            <nav className="flex flex-wrap gap-x-5 gap-y-1">
              <a href="/about" className="hover:text-foreground">About</a>
              <a href="/privacy" className="hover:text-foreground">Privacy</a>
              <a href="/terms" className="hover:text-foreground">Terms</a>
              <a href="/contact" className="hover:text-foreground">Contact</a>
              <a href="/press" className="hover:text-foreground">Press</a>
            </nav>
            <div className="md:hidden">
              <PoweredByBadge inline />
            </div>
          </footer>
        </main>
      </div>

      <FilePreviewModal
        file={preview?.file ?? null}
        siblings={preview?.list}
        onNavigate={(file) => setPreview((cur) => (cur ? { ...cur, file } : cur))}
        onDownload={download}
        onClose={() => setPreview(null)}
      />
      <ShareLinkDialog file={shareFile} onClose={() => setShareFile(null)} />

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
