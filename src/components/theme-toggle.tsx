'use client';

import React from 'react';
import { useTheme } from './theme-provider';
import { Sun, Moon, Laptop } from 'lucide-react';

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };

  return (
    <button
      type="button"
      onClick={cycleTheme}
      aria-label={`Toggle color theme. Current theme is ${theme} (${resolvedTheme} mode). Press to change.`}
      className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] p-2.5 rounded-xl border border-rule bg-paper hover:bg-paper-subtle text-ink transition-colors focus-visible:ring-2 focus-visible:ring-accent"
      title={`Theme: ${theme}`}
    >
      {theme === 'system' ? (
        <Laptop className="h-4 w-4 text-accent" aria-hidden="true" />
      ) : resolvedTheme === 'dark' ? (
        <Moon className="h-4 w-4 text-accent" aria-hidden="true" />
      ) : (
        <Sun className="h-4 w-4 text-accent" aria-hidden="true" />
      )}
      <span className="sr-only">Toggle theme ({theme})</span>
    </button>
  );
}
