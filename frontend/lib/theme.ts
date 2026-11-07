import { local, STORAGE_PREFIX } from './storage';

/**
 * The browser's own chrome can be light, dark, or follow the system. Pages
 * people published keep their own colours, as they would in any browser.
 */
export type Theme = 'system' | 'light' | 'dark';

export const THEMES: Theme[] = ['system', 'light', 'dark'];
const NAME = 'theme';

/** Runs before first paint (see app/layout.tsx) so the page never flashes the wrong theme. */
export const THEME_BOOT_SCRIPT = `try{var t=localStorage.getItem('${STORAGE_PREFIX}${NAME}');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;

export function readTheme(): Theme {
  const t = local.get(NAME);
  return t === 'light' || t === 'dark' ? t : 'system';
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'system') {
    delete root.dataset.theme;
    local.remove(NAME);
  } else {
    root.dataset.theme = theme;
    local.set(NAME, theme);
  }
}
