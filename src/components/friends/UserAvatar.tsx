import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface Props {
  name?: string | null;
  photo?: string | null;
  className?: string;
}

export const UserAvatar: React.FC<Props> = ({ name, photo, className }) => {
  const initials = (name || 'U')
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <Avatar className={cn('h-9 w-9', className)}>
      {photo ? <AvatarImage src={photo} alt={name || 'User'} /> : null}
      <AvatarFallback className="bg-primary/15 text-primary text-xs font-medium">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};
