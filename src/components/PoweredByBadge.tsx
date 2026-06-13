import defyscaleLogo from '@/assets/defyshare-logo.png.asset.json';

export const PoweredByBadge = () => (
  <a
    href="https://defyscale.com"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Powered by DefyScale"
    className="fixed bottom-3 left-3 z-40 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/80 backdrop-blur px-3 py-1.5 text-xs font-medium text-foreground shadow-md hover:bg-card hover:scale-105 transition"
  >
    <span className="text-muted-foreground font-normal">Powered by</span>
    <img src={defyscaleLogo.url} alt="DefyScale" className="w-5 h-5" />
    <span>DefyScale</span>
  </a>
);
