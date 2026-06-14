import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserAvatar } from '@/components/friends/UserAvatar';
import { useFriendsData, ProfileRow } from '@/hooks/useFriendsData';
import { useAuth } from '@/hooks/useAuth';
import { useProfileSync } from '@/hooks/useProfileSync';
import { useToast } from '@/hooks/use-toast';
import ThemeToggle from '@/components/ThemeToggle';
import AuthButton from '@/components/AuthButton';

const FriendRequestsPage: React.FC = () => {
  useProfileSync();
  const { user } = useAuth();
  const {
    received,
    sent,
    blocks,
    acceptRequest,
    rejectRequest,
    cancelRequest,
    markRequestsRead,
    blockUser,
    unblockUser,
    sendFriendRequest,
    searchPeople,
  } = useFriendsData();
  const { toast } = useToast();

  const [addQ, setAddQ] = useState('');
  const [results, setResults] = useState<ProfileRow[]>([]);

  useEffect(() => {
    markRequestsRead();
  }, [markRequestsRead]);

  useEffect(() => {
    const id = setTimeout(async () => {
      if (addQ.trim().length < 2) {
        setResults([]);
        return;
      }
      const r = await searchPeople(addQ);
      setResults(r);
    }, 250);
    return () => clearTimeout(id);
  }, [addQ, searchPeople]);

  const tryAddByEmail = async () => {
    const res = await sendFriendRequest(addQ);
    if (res.ok) {
      toast({ title: 'Friend request sent' });
      setAddQ('');
      setResults([]);
    } else {
      toast({ title: res.reason ?? 'Could not send request', variant: 'destructive' });
    }
  };

  const sendToId = async (p: ProfileRow) => {
    const res = await sendFriendRequest(p.user_id, { byUserId: true });
    if (res.ok) {
      toast({ title: `Request sent to ${p.google_name ?? 'user'}` });
    } else {
      toast({ title: res.reason ?? 'Could not send', variant: 'destructive' });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center space-y-4 max-w-sm">
          <h1 className="text-xl font-semibold">Sign in to manage friends</h1>
          <AuthButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center gap-2 px-3 h-12 border-b border-border/50">
        <Link to="/friends">
          <Button variant="ghost" size="icon" aria-label="Back">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="font-semibold flex-1">Friend Requests</h1>
        <ThemeToggle />
        <AuthButton />
      </header>

      <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
        <div className="rounded-xl border border-border/50 bg-card/30 p-4 space-y-3">
          <div className="text-sm font-medium">Add a friend</div>
          <div className="flex gap-2">
            <Input
              placeholder="Search by name or paste email…"
              value={addQ}
              onChange={(e) => setAddQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && addQ.includes('@')) {
                  e.preventDefault();
                  tryAddByEmail();
                }
              }}
            />
            <Button onClick={tryAddByEmail}>Add Friend</Button>
          </div>
          {addQ.trim().length >= 2 && (
            <div className="border border-border/50 rounded-md max-h-64 overflow-auto">
              {results.length === 0 ? (
                <div className="p-3 text-xs text-muted-foreground">
                  User not found. They need to sign in to DefyShare first.
                </div>
              ) : (
                <ul>
                  {results.map((p) => (
                    <li
                      key={p.user_id}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-secondary/50"
                    >
                      <UserAvatar name={p.google_name} photo={p.google_photo} className="h-8 w-8" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm">{p.google_name}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {p.google_email}
                        </div>
                      </div>
                      <Button size="sm" onClick={() => sendToId(p)}>
                        Send request
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <Tabs defaultValue="received">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="received">
              Received
              {received.length > 0 && (
                <span className="ml-2 text-xs text-muted-foreground">({received.length})</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent">
              Sent
              {sent.length > 0 && (
                <span className="ml-2 text-xs text-muted-foreground">({sent.length})</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="blocked">
              Blocked
              {blocks.length > 0 && (
                <span className="ml-2 text-xs text-muted-foreground">({blocks.length})</span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="mt-4">
            <ScrollArea className="max-h-[60vh]">
              {received.length === 0 && (
                <p className="text-sm text-muted-foreground p-4 text-center">
                  No incoming requests.
                </p>
              )}
              <ul className="space-y-2">
                {received.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center gap-3 p-3 rounded-md border border-border/50 bg-card/40"
                  >
                    <UserAvatar name={r.profile?.google_name} photo={r.profile?.google_photo} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {r.profile?.google_name || 'User'}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {r.profile?.google_email} · {new Date(r.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <Button size="sm" onClick={() => acceptRequest(r)}>
                      Accept
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => rejectRequest(r)}>
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => blockUser(r.sender_id)}
                    >
                      Block
                    </Button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="sent" className="mt-4">
            <ScrollArea className="max-h-[60vh]">
              {sent.length === 0 && (
                <p className="text-sm text-muted-foreground p-4 text-center">
                  No outgoing requests.
                </p>
              )}
              <ul className="space-y-2">
                {sent.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center gap-3 p-3 rounded-md border border-border/50 bg-card/40"
                  >
                    <UserAvatar name={r.profile?.google_name} photo={r.profile?.google_photo} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {r.profile?.google_name || 'User'}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {r.profile?.google_email} · {r.status}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => cancelRequest(r)}>
                      Cancel
                    </Button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="blocked" className="mt-4">
            <ScrollArea className="max-h-[60vh]">
              {blocks.length === 0 && (
                <p className="text-sm text-muted-foreground p-4 text-center">No blocked users.</p>
              )}
              <ul className="space-y-2">
                {blocks.map((b) => (
                  <li
                    key={b.id}
                    className="flex items-center gap-3 p-3 rounded-md border border-border/50 bg-card/40"
                  >
                    <UserAvatar name={b.profile?.google_name} photo={b.profile?.google_photo} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {b.profile?.google_name || 'User'}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {b.profile?.google_email} · blocked{' '}
                        {new Date(b.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => unblockUser(b.blocked_user_id)}>
                      Unblock
                    </Button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FriendRequestsPage;
