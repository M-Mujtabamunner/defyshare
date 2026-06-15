import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfileSync } from '@/hooks/useProfileSync';
import { FriendsSidebar } from '@/components/friends/FriendsSidebar';
import { CreateGroupModal } from '@/components/friends/CreateGroupModal';
import ThemeToggle from '@/components/ThemeToggle';
import AuthButton from '@/components/AuthButton';
import SettingsSheet from '@/components/SettingsSheet';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { FriendsLoadingOverlay } from '@/components/friends/FriendsLoadingOverlay';
import FriendChat from './FriendChat';
import GroupChat from './GroupChat';
import FriendsEmpty from './FriendsEmpty';
import { supabase } from '@/integrations/supabase/client';
import { primeMessages } from '@/lib/messagesCache';
import type { MessageRow } from '@/hooks/useMessages';

export type FriendsSelection =
  | { kind: 'friend'; friendId: string; name?: string | null }
  | { kind: 'group'; conversationId: string }
  | null;

const FriendsLayout: React.FC = () => {
  useProfileSync();
  const { user } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [selection, setSelection] = useState<FriendsSelection>(null);

  const [booted, setBooted] = useState(false);
  const [progress, setProgress] = useState(0);

  // 3-second boot overlay + prefetch top 10 conversations' last 7 messages
  useEffect(() => {
    if (!user) {
      setBooted(true);
      return;
    }
    setBooted(false);
    setProgress(0);
    let cancelled = false;
    const start = Date.now();
    const MIN_MS = 3000;

    const tick = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(90, (elapsed / MIN_MS) * 90);
      setProgress(pct);
    }, 60);

    (async () => {
      try {
        const { data: mine } = await supabase
          .from('conversation_members')
          .select('conversation_id')
          .eq('user_id', user.id);
        const ids = (mine ?? []).map((m: any) => m.conversation_id as string);
        if (ids.length) {
          const { data: convs } = await supabase
            .from('conversations')
            .select('id, last_message_at')
            .in('id', ids)
            .order('last_message_at', { ascending: false, nullsFirst: false })
            .limit(10);
          const top = (convs ?? []).map((c: any) => c.id as string);
          await Promise.all(
            top.map(async (cid) => {
              const { data } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', cid)
                .order('created_at', { ascending: false })
                .limit(7);
              if (data) {
                const rows = ((data as MessageRow[]) ?? []).slice().reverse();
                primeMessages(cid, rows);
              }
            }),
          );
        }
      } catch {
        // silent: overlay will still close
      }

      const elapsed = Date.now() - start;
      const wait = Math.max(0, MIN_MS - elapsed);
      setTimeout(() => {
        if (cancelled) return;
        clearInterval(tick);
        setProgress(100);
        setTimeout(() => !cancelled && setBooted(true), 180);
      }, wait);
    })();

    return () => {
      cancelled = true;
      clearInterval(tick);
    };
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center space-y-4 max-w-sm">
          <h1 className="text-xl font-semibold">Sign in to use Friends</h1>
          <p className="text-sm text-muted-foreground">
            Friends, groups, and messaging are tied to your Google account.
          </p>
          <AuthButton />
        </div>
      </div>
    );
  }

  const activeId =
    selection?.kind === 'friend'
      ? selection.friendId
      : selection?.kind === 'group'
        ? selection.conversationId
        : null;

  return (
    <ErrorBoundary>
      {!booted && <FriendsLoadingOverlay progress={progress} />}
      <div className="h-screen flex flex-col bg-background">
        <header className="flex items-center gap-2 px-3 h-12 border-b border-border/50 shrink-0">
          <Link to="/" className="flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="Home">
              <Home className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="font-semibold text-sm md:text-base flex-1 truncate">
            Defy<span className="text-primary">Share</span> · Friends
          </h1>
          <ThemeToggle />
          <SettingsSheet />
          <AuthButton />
        </header>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-[320px_1fr] min-h-0">
          <div className={'min-h-0 ' + (activeId ? 'hidden md:block' : 'block')}>
            <FriendsSidebar
              activeSelection={selection}
              onSelectFriend={(friendId, name) =>
                setSelection({ kind: 'friend', friendId, name })
              }
              onSelectGroup={(conversationId) =>
                setSelection({ kind: 'group', conversationId })
              }
              onBack={() => setSelection(null)}
              onCreateGroup={() => setCreateOpen(true)}
            />
          </div>
          <main className="min-h-0 min-w-0">
            {selection?.kind === 'friend' ? (
              <FriendChat key={selection.friendId} friendId={selection.friendId} />
            ) : selection?.kind === 'group' ? (
              <GroupChat key={selection.conversationId} conversationId={selection.conversationId} />
            ) : (
              <FriendsEmpty />
            )}
          </main>
        </div>

        <CreateGroupModal open={createOpen} onClose={() => setCreateOpen(false)} />
      </div>
    </ErrorBoundary>
  );
};

export default FriendsLayout;
