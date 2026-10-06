import React from 'react';
import { cn } from '@/lib/utils';

interface HeaderButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  count?: number;
}

/** Round icon button for the header, with an optional red count badge. */
const HeaderButton = React.forwardRef<HTMLButtonElement, HeaderButtonProps>(({ label, count = 0, className, children, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    aria-label={count > 0 ? `${label} (${count})` : label}
    title={label}
    className={cn(
      'relative grid place-items-center w-8 h-8 sm:w-9 sm:h-9 rounded-full text-foreground/80 hover:text-foreground hover:bg-secondary transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      className,
    )}
    {...props}
  >
    {children}
    {count > 0 && (
      <span className="absolute top-0.5 end-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold leading-4 text-center ring-2 ring-background tabular-nums">
        {count > 9 ? '9+' : count}
      </span>
    )}
  </button>
));
HeaderButton.displayName = 'HeaderButton';

export default HeaderButton;
