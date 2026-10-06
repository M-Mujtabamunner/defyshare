import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/ThemeProvider';
import { cn } from '@/lib/utils';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === 'dark';

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
      className="relative"
    >
      <Sun className={cn('w-4 h-4 transition-all duration-300', dark ? 'rotate-90 scale-0' : 'rotate-0 scale-100')} />
      <Moon className={cn('absolute w-4 h-4 transition-all duration-300', dark ? 'rotate-0 scale-100' : '-rotate-90 scale-0')} />
    </Button>
  );
};

export default ThemeToggle;
