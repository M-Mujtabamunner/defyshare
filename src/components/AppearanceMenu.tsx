import React from 'react';
import { Check, Monitor, Moon, Sun } from 'lucide-react';
import HeaderButton from '@/components/HeaderButton';
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
      light: { bg: '#F3F5F6', card: '#FFFFFF', line: '#DCE0E5', accent: '#15171C' },
      dark: { bg: '#1C1D21', card: '#232529', line: '#3A3D44', accent: '#D3D6DC' },
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

/** Theme and design pickers, shown inside Settings. */
export const AppearanceControls: React.FC = () => {
  const { t } = useT();
  const { mode, setMode, design, setDesign, resolved } = useTheme();

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium">{t('appearance')}</h3>
      <div role="radiogroup" aria-label={t('theme')} className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-secondary">
        {MODES.map(({ value, label, Icon }) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={mode === value}
            onClick={() => setMode(value)}
            className={cn(
              'flex flex-col items-center gap-1 rounded-lg py-2 text-xs font-medium transition-colors',
              mode === value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="w-4 h-4" />
            {t(label)}
          </button>
        ))}
      </div>
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
                'relative rounded-xl border-2 p-1.5 text-start transition-colors',
                selected ? 'border-foreground' : 'border-border hover:border-foreground/30',
              )}
            >
              <Preview swatch={swatch[resolved]} />
              <span className="flex items-center justify-between mt-1.5 px-0.5 text-xs font-medium">
                {t(label)}
                {selected && <Check className="w-3.5 h-3.5" />}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

/** Header shortcut: flips between bright and dark. */
export const ThemeToggle: React.FC<{ className?: string }> = ({ className }) => {
  const { t } = useT();
  const { setMode, resolved } = useTheme();
  return (
    <HeaderButton label={t('changeTheme')} className={className} onClick={() => setMode(resolved === 'dark' ? 'light' : 'dark')}>
      {resolved === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
    </HeaderButton>
  );
};
