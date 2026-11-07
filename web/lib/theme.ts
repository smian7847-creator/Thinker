'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * The browser's own chrome can be light, dark, or follow the system. Pages
 * people published keep their own colours, as they would in any browser.
 */
export type Theme = 'system' | 'light' | 'dark';

export const THEME_KEY = 'smallweb:theme';
const ORDER: Theme[] = ['system', 'light', 'dark'];

/** Runs before first paint (see app/layout.tsx) so the page never flashes the wrong theme. */
export const THEME_BOOT = `try{var t=localStorage.getItem('${THEME_KEY}');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;

function read(): Theme {
  try {
    const t = localStorage.getItem(THEME_KEY);
    if (t === 'light' || t === 'dark') return t;
  } catch {}
  return 'system';
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(read);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') delete root.dataset.theme;
    else root.dataset.theme = theme;
    try {
      if (theme === 'system') localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, theme);
    } catch {}
  }, [theme]);

  const cycle = useCallback(() => setTheme((t) => ORDER[(ORDER.indexOf(t) + 1) % ORDER.length]), []);
  return { theme, setTheme, cycle };
}
