'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Props for the ThemeProvider component.
 */
export interface ThemeProviderProps {
  /** Child elements wrapped in theme context */
  children: React.ReactNode;
}

/**
 * Global ThemeProvider managing light, dark, and system preference media queries.
 *
 * @param {ThemeProviderProps} props - Theme provider properties.
 * @returns {React.ReactElement} The theme provider element.
 */
export function ThemeProvider({ children }: ThemeProviderProps): React.ReactElement {
  const [theme, setTheme] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('utsav_os_theme') as Theme | null;
      if (saved && ['light', 'dark', 'system'].includes(saved)) {
        setTheme(saved);
      }
    } catch {
      // Safe fallback if local storage access is restricted
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateResolved = (): void => {
      let active: 'light' | 'dark' = 'light';
      if (theme === 'system') {
        active = mediaQuery.matches ? 'dark' : 'light';
      } else {
        active = theme;
      }
      setResolvedTheme(active);

      if (active === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    updateResolved();
    mediaQuery.addEventListener('change', updateResolved);
    return () => mediaQuery.removeEventListener('change', updateResolved);
  }, [theme]);

  const handleSetTheme = (newTheme: Theme): void => {
    setTheme(newTheme);
    try {
      localStorage.setItem('utsav_os_theme', newTheme);
    } catch {
      // Safe fallback if quota exceeded
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme: handleSetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access current color theme preference and mutator.
 *
 * @returns {ThemeContextType} Theme state and setter.
 * @throws {Error} If called outside ThemeProvider.
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
