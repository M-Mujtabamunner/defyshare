import React, { useEffect, useState } from 'react';
import { Check, Monitor, Moon, Pencil, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useTheme, type Design, type ResolvedTheme, type ThemeMode } from '@/components/ThemeProvider';
import { cn } from '@/lib/utils';
import { useT, type MessageKey } from '@/lib/i18n';

const MODES: { value: ThemeMode; label: MessageKey; Icon: typeof Sun }[] = [
  { value: 'light', label: 'bright', Icon: Sun },
  { value: 'dark', label: 'dark', Icon: Moon },
  { value: 'system', label: 'system', Icon: Monitor },
];

interface Swatch {
  bg: string;
  card: string;
  line: string;
  accent: string;
}

const DESIGNS: { value: Design; label: MessageKey; swatch: Record<ResolvedTheme, Swatch> }[] = [
  {
    value: 'warm',
    label: 'current',
    swatch: {
      light: { bg: '#F4EFE6', card: '#FBF8F3', line: '#D9CFC0', accent: '#FD6F3B' },
      dark: { bg: '#24211E', card: '#2B2826', line: '#46403B', accent: '#F2683A' },
    },
  },
  {
    value: 'classic',
    label: 'classic',
    swatch: {
      light: { bg: '#EBECF0', card: '#FFFFFF', line: '#DCDFE5', accent: '#14B8AA' },
      dark: { bg: '#0C0E12', card: '#15181E', line: '#2A2F38', accent: '#1AE6D4' },
    },
  },
];

const HINT_KEY = 'defyshare:theme-hint-seen';

/** Mini page mock-up in a design's colours. */
const Preview: React.FC<{ swatch: Swatch }> = ({ swatch }) => (
  <div className="rounded-md p-2 space-y-1.5" style={{ background: swatch.bg }}>
    <div className="flex items-center gap-1">
      <span className="w-3 h-3 rounded-[3px]" style={{ background: swatch.accent }} />
      <span className="h-1.5 w-8 rounded-full" style={{ background: swatch.line }} />
    </div>
    <div className="rounded p-1.5 space-y-1" style={{ background: swatch.card }}>
      <span className="block h-1.5 w-full rounded-full" style={{ background: swatch.line }} />
      <span className="block h-1.5 w-2/3 rounded-full" style={{ background: swatch.line }} />
    </div>
    <span className="block h-2.5 w-10 rounded-full" style={{ background: swatch.accent }} />
  </div>
);

/** Small chat-style bubble that types itself out next to the pencil on a first visit. */
const ThemeHint: React.FC<{ onOpen: () => void; onDone: () => void }> = ({ onOpen, onDone }) => {
  const { t } = useT();
  const HINT_TEXT = t('themeHint');
  const [chars, setChars] = useState(0);

  useEffect(() => {
    const typing = setInterval(() => setChars((n) => Math.min(n + 1, HINT_TEXT.length)), 28);
    const hide = setTimeout(onDone, 3000);
    return () => {
      clearInterval(typing);
      clearTimeout(hide);
    };
  }, [onDone, HINT_TEXT.length]);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="absolute left-0 top-full mt-2.5 z-50 animate-in fade-in-0 slide-in-from-top-1 duration-200"
    >
      <span className="absolute -top-1 left-3.5 w-2.5 h-2.5 rotate-45 bg-foreground" />
      <span className="relative flex items-center gap-2 rounded-xl bg-foreground text-background pl-2.5 pr-3 py-1.5 text-[13px] font-medium shadow-lg whitespace-nowrap">
        <Pencil className="w-3.5 h-3.5 shrink-0" />
        <span>
          {HINT_TEXT.slice(0, chars)}
          {chars < HINT_TEXT.length && <span className="inline-block w-[2px] h-3.5 -mb-0.5 ml-px bg-background/70 animate-pulse" />}
        </span>
      </span>
    </button>
  );
};

const AppearanceMenu: React.FC = () => {
  const { t } = useT();
  const { mode, setMode, design, setDesign, resolved } = useTheme();
  const [open, setOpen] = useState(false);
  const [hint, setHint] = useState(false);

  // First visit only: show the hint for the first 3 seconds.
  useEffect(() => {
    let seen = true;
    try {
      seen = localStorage.getItem(HINT_KEY) === '1';
      localStorage.setItem(HINT_KEY, '1');
    } catch {
      /* storage blocked: skip the hint */
    }
    if (!seen) setHint(true);
  }, []);

  const hideHint = React.useCallback(() => setHint(false), []);

  return (
    <div className="relative shrink-0">
      <Sheet
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (o) setHint(false);
        }}
      >
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={t('changeTheme')} title={t('changeTheme')}>
            <Pencil className="w-4 h-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] sm:max-w-[300px]">
          <SheetHeader>
            <SheetTitle>{t('appearance')}</SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            <section className="space-y-2">
              <h3 className="text-xs font-medium text-muted-foreground">{t('theme')}</h3>
              <div role="radiogroup" aria-label={t('theme')} className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-secondary">
                {MODES.map(({ value, label, Icon }) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={mode === value}
                    onClick={() => setMode(value)}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-md py-2 text-xs font-medium transition-colors',
                      mode === value ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {t(label)}
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="text-xs font-medium text-muted-foreground">{t('design')}</h3>
              <div role="radiogroup" aria-label={t('design')} className="grid grid-cols-2 gap-2">
                {DESIGNS.map(({ value, label, swatch }) => {
                  const selected = design === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setDesign(value)}
                      className={cn(
                        'relative rounded-lg border-2 p-1.5 text-left transition-colors',
                        selected ? 'border-primary' : 'border-border hover:border-primary/40',
                      )}
                    >
                      <Preview swatch={swatch[resolved]} />
                      <span className="flex items-center justify-between mt-1.5 px-0.5 text-xs font-medium">
                        {t(label)}
                        {selected && <Check className="w-3.5 h-3.5 text-primary" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        </SheetContent>
      </Sheet>

      {hint && <ThemeHint onOpen={() => setOpen(true)} onDone={hideHint} />}
    </div>
  );
};

export default AppearanceMenu;
