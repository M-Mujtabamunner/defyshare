import React, { useEffect, useState } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfileSync } from '@/hooks/useProfileSync';
import { FriendsSidebar } from '@/components/friends/FriendsSidebar';
import { CreateGroupModal } from '@/components/friends/CreateGroupModal';
import ThemeToggle from '@/components/ThemeToggle';
import AuthButton from '@/components/AuthButton';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const FriendsLayout: React.FC = () => {
  useProfileSync();
  const { user } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const params = useParams();
  const activeId =
    (params as { friendSlug?: string; groupSlug?: string }).friendSlug ??
    (params as { groupSlug?: string }).groupSlug ??
    null;

  // mobile: close sidebar when an item is clicked
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    setMobileOpen(false);
  }, [activeId]);

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

  return (
    <ErrorBoundary>
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
        <AuthButton />
      </header>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-[320px_1fr] min-h-0">
        <div
          className={
            'min-h-0 ' +
            (activeId ? 'hidden md:block' : 'block')
          }
        >
          <FriendsSidebar
            activeId={activeId}
            onCreateGroup={() => setCreateOpen(true)}
            onItemClick={() => setMobileOpen(false)}
          />
        </div>
        <main className="min-h-0 min-w-0">
          <Outlet />
        </main>
      </div>

      <CreateGroupModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
    </ErrorBoundary>
  );
};

export default FriendsLayout;
