import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';

const AD_CLIENT = 'ca-pub-3440868789646344';

/** Ad unit IDs from AdSense (Ads → By ad unit). Empty = reserved space only. */
export const AD_SLOTS = {
  inContent: import.meta.env.VITE_AD_SLOT_IN_CONTENT as string | undefined,
  rail: import.meta.env.VITE_AD_SLOT_RAIL as string | undefined,
  footer: import.meta.env.VITE_AD_SLOT_FOOTER as string | undefined,
};

interface AdSlotProps {
  slot?: string;
  format?: 'auto' | 'horizontal' | 'vertical' | 'rectangle';
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * Fixed-size ad space. The size is reserved up front so the page never jumps
 * when an ad loads.
 */
const AdSlot: React.FC<AdSlotProps> = ({ slot, format = 'auto', className }) => {
  useEffect(() => {
    if (!slot) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* blocked by an ad blocker */
    }
  }, [slot]);

  return (
    <aside
      aria-label="Advertisement"
      className={cn(
        'relative overflow-hidden rounded-xl border border-border/70 bg-card/50 flex items-center justify-center',
        className,
      )}
    >
      <span className="absolute top-1.5 left-2.5 text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground/60 select-none">
        Advertisement
      </span>
      {slot && (
        <ins
          className="adsbygoogle"
          style={{ display: 'block', width: '100%', height: '100%' }}
          data-ad-client={AD_CLIENT}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      )}
    </aside>
  );
};

export default AdSlot;
