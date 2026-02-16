'use client';

import { useTheme } from '@/app/providers/ThemeProvider';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      aria-label={`Current: ${theme}. Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
    >
      {theme === 'dark' ? (
        <span className="theme-icon" aria-hidden>☀️</span>
      ) : (
        <span className="theme-icon" aria-hidden>🌙</span>
      )}
    </button>
  );
}
