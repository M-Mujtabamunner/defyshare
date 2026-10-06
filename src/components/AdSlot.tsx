import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface Banner {
  key: string;
  width: number;
  height: number;
}

const AD_SCRIPT_HOST = 'https://bauval.org/22/';

const BANNERS = {
  rail: { key: '0eb08e46e730fa7fef6eff8a1e82f2f2', width: 160, height: 600 },
  leaderboard: { key: 'ae825a63e80a9cc7c040ae953a8733ba', width: 468, height: 60 },
  mobile: { key: '0d8648aefe934db5dc15662b8920f00a', width: 320, height: 50 },
  rectangle: { key: '96bedf554fcf57d3151520cb3f6f3849', width: 300, height: 250 },
} satisfies Record<string, Banner>;

/** `inContent` is 468x60 on screens 640px and wider, 320x50 on phones. */
type Placement = 'rail' | 'inContent' | 'rectangle';

const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);
  return matches;
};

// Each unit runs in its own document: the network's snippet reads a global
// `atOptions`, so several units on one page would otherwise overwrite each other.
const bannerDoc = (b: Banner) =>
  '<!doctype html><html><head><meta charset="utf-8">' +
  '<style>html,body{margin:0;padding:0;overflow:hidden;background:transparent}</style></head><body>' +
  `<script>atOptions={'key':'${b.key}','format':'iframe','height':${b.height},'width':${b.width},'params':{}};</script>` +
  `<script src="${AD_SCRIPT_HOST}${b.key}"></script></body></html>`;

interface AdSlotProps {
  placement: Placement;
  className?: string;
}

/** Fixed-size banner; the size is reserved up front so the page never jumps. */
const AdSlot: React.FC<AdSlotProps> = ({ placement, className }) => {
  const wide = useMediaQuery('(min-width: 640px)');
  const xl = useMediaQuery('(min-width: 1280px)');

  // Rails only fit beside the content on xl screens; don't load an ad nobody sees.
  if (placement === 'rail' && !xl) return null;

  const banner: Banner =
    placement === 'rail'
      ? BANNERS.rail
      : placement === 'rectangle'
        ? BANNERS.rectangle
        : wide
          ? BANNERS.leaderboard
          : BANNERS.mobile;

  return (
    <aside aria-label="Advertisement" className={cn('flex flex-col items-center gap-1', className)}>
      <span className="text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground/60 select-none">
        Advertisement
      </span>
      <iframe
        key={banner.key}
        title="Advertisement"
        srcDoc={bannerDoc(banner)}
        width={banner.width}
        height={banner.height}
        loading="lazy"
        scrolling="no"
        // Clicks may open the advertiser in a new tab; the ad can't redirect this page by itself.
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
        className="ad-frame block max-w-full border-0 rounded-md bg-card/60"
        // Match the ad document's (light) scheme, or browsers paint the frame white in dark mode.
        style={{ width: banner.width, height: banner.height, colorScheme: 'light' }}
      />
    </aside>
  );
};

export default AdSlot;
