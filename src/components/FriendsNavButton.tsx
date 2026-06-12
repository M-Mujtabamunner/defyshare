import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFriendsData } from '@/hooks/useFriendsData';
import { useConversations } from '@/hooks/useConversations';
import { cn } from '@/lib/utils';

interface Props {
  className?: string;
}

export const FriendsNavButton: React.FC<Props> = ({ className }) => {
  const { unreadRequestsCount } = useFriendsData();
  const { totalUnread } = useConversations();
  const showDot = unreadRequestsCount > 0 || totalUnread > 0;
  return (
    <Link to="/friends" className={cn('relative', className)}>
      <Button variant="ghost" size="icon" aria-label="Friends">
        <MessageSquare className="w-4 h-4" />
      </Button>
      {showDot && (
        <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-destructive ring-2 ring-background" />
      )}
    </Link>
  );
};
