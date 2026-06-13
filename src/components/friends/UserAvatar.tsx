import React, { useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface Props {
  name?: string | null;
  photo?: string | null;
  className?: string;
}

/**
 * Google user-content URLs (lh3.googleusercontent.com) accept a size hint
 * like `=s96-c`. Requesting a tightly-sized image dramatically reduces
 * bytes and decode time — avatars rarely render bigger than 96 CSS px.
 */
const sizedPhoto = (url: string, px = 96): string => {
  try {
    if (!/googleusercontent\.com/.test(url)) return url;
    // strip existing size suffix (=s512-c, =s96-c-rw, etc.)
    const base = url.replace(/=s\d+(-[a-z]+)*$/i, '');
    return `${base}=s${px}-c`;
  } catch {
    return url;
  }
};

export const UserAvatar: React.FC<Props> = ({ name, photo, className }) => {
  const initials = (name || 'U')
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const src = useMemo(() => (photo ? sizedPhoto(photo, 96) : null), [photo]);

  return (
    <Avatar className={cn('h-9 w-9', className)}>
      {src ? (
        <AvatarImage
          src={src}
          alt={name || 'User'}
          loading="eager"
          decoding="async"
          // @ts-expect-error fetchpriority is a valid HTML attribute
          fetchpriority="high"
          referrerPolicy="no-referrer"
        />
      ) : null}
      <AvatarFallback className="bg-primary/15 text-primary text-xs font-medium">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};
