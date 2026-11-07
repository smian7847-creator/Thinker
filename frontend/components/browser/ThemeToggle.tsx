'use client';

import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/lib/theme';

const ICON: Record<Theme, string> = { system: '◐', light: '☀', dark: '☾' };
const LABEL: Record<Theme, string> = { system: 'match system', light: 'light', dark: 'dark' };

export function ThemeToggle() {
  const { theme, cycle } = useTheme();
  return (
    <button
      className="theme-toggle"
      onClick={cycle}
      title={`Theme: ${LABEL[theme]} (click to change)`}
      aria-label={`Theme: ${LABEL[theme]}`}
    >
      {ICON[theme]}
    </button>
  );
}
