import defyscaleLogo from '@/assets/defyscale-logo.png.asset.json';

export const PoweredByBadge = () => (
  <a
    href="https://defyscale.com"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Powered by DefyScale"
    style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)' }}
    className="fixed left-2 z-40 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/80 backdrop-blur px-2 py-1 text-[10px] sm:text-xs font-medium text-foreground shadow-md hover:bg-card hover:scale-105 transition"
  >
    <span className="text-muted-foreground font-normal">Powered by</span>
    <img src={defyscaleLogo.url} alt="" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
    <span className="whitespace-nowrap">DefyScale</span>
  </a>
);
