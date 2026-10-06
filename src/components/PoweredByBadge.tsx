import defyscaleLogo from '@/assets/defyscale-logo.png';
import { cn } from '@/lib/utils';

/**
 * "Powered by DefyScale". Floats in the corner on larger screens; `inline` renders
 * it in the page flow instead (used in the footer on phones, where a floating
 * badge would cover content).
 */
export const PoweredByBadge = ({ inline = false }: { inline?: boolean }) => (
  <a
    href="https://defyscale.com"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Powered by DefyScale"
    style={inline ? undefined : { bottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)' }}
    className={cn(
      'items-center gap-1.5 rounded-full border border-border bg-card/90 backdrop-blur px-2.5 py-1 text-[10px] sm:text-xs font-medium text-foreground shadow-sm hover:border-primary/40 transition-colors',
      inline ? 'inline-flex' : 'fixed left-2 z-40 hidden md:inline-flex',
    )}
  >
    <span className="text-muted-foreground font-normal">Powered by</span>
    <img src={defyscaleLogo} alt="" width={16} height={16} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
    <span className="whitespace-nowrap font-semibold">DefyScale</span>
  </a>
);
