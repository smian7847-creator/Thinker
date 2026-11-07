'use client';

import { useCallback, useEffect, useState } from 'react';
import { applyTheme, readTheme, Theme, THEMES } from '@/lib/theme';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readTheme);

  useEffect(() => applyTheme(theme), [theme]);

  /** system → light → dark → system */
  const cycle = useCallback(() => setTheme((t) => THEMES[(THEMES.indexOf(t) + 1) % THEMES.length]), []);

  return { theme, setTheme, cycle };
}
