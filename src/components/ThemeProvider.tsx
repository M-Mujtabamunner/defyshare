import { createContext, useContext, useEffect } from 'react';

// The site uses a single light theme (cream + orange).
type Theme = 'light';

interface ThemeContextType {
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextType>({ theme: 'light' });

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');
    try {
      localStorage.removeItem('theme');
    } catch {
      /* ignore */
    }
  }, []);

  return <ThemeContext.Provider value={{ theme: 'light' }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
