import { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type Design = 'warm' | 'classic';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  design: Design;
  setDesign: (design: Design) => void;
  /** The light/dark theme actually shown (System resolved against the device). */
  resolved: ResolvedTheme;
}

// Keep these keys in sync with the inline script in index.html, which applies
// the saved choice before first paint so there's no flash.
const MODE_KEY = 'defyshare:theme-mode';
const DESIGN_KEY = 'defyshare:design';
const LEGACY_KEY = 'defyshare:theme'; // earlier light/dark-only setting

const THEME_COLOR: Record<Design, Record<ResolvedTheme, string>> = {
  warm: { light: '#F4EFE6', dark: '#24211E' },
  classic: { light: '#EBECF0', dark: '#0C0E12' },
};

const read = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const write = (key: string, value: string | null) => {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* storage blocked */
  }
};

const readMode = (): ThemeMode => {
  const saved = read(MODE_KEY);
  if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
  // Only an explicit dark choice from the old toggle carries over; everyone else follows the device.
  return read(LEGACY_KEY) === 'dark' ? 'dark' : 'system';
};

const readDesign = (): Design => (read(DESIGN_KEY) === 'classic' ? 'classic' : 'warm');

const DARK_QUERY = '(prefers-color-scheme: dark)';

const ThemeContext = createContext<ThemeContextType>({
  mode: 'system',
  setMode: () => undefined,
  design: 'warm',
  setDesign: () => undefined,
  resolved: 'light',
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setMode] = useState<ThemeMode>(readMode);
  const [design, setDesign] = useState<Design>(readDesign);
  const [systemDark, setSystemDark] = useState(() => window.matchMedia(DARK_QUERY).matches);

  useEffect(() => {
    const mql = window.matchMedia(DARK_QUERY);
    const onChange = () => setSystemDark(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  const resolved: ResolvedTheme = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', resolved === 'dark');
    root.classList.toggle('light', resolved === 'light');
    root.classList.toggle('theme-classic', design === 'classic');
    root.style.colorScheme = resolved;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[design][resolved]);
  }, [resolved, design]);

  useEffect(() => {
    write(MODE_KEY, mode);
    write(LEGACY_KEY, null);
  }, [mode]);

  useEffect(() => {
    write(DESIGN_KEY, design);
  }, [design]);

  return (
    <ThemeContext.Provider value={{ mode, setMode, design, setDesign, resolved }}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
