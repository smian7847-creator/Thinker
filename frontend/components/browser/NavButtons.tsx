'use client';

import type { Tab } from '@/hooks/useTab';

/** Back, forward, and reload (which becomes stop while a page is loading). */
export function NavButtons({ tab }: { tab: Tab }) {
  return (
    <div className="nav-buttons">
      <button onClick={tab.back} disabled={!tab.canGoBack} title="Back (Alt+Left)" aria-label="Back">
        ←
      </button>
      <button onClick={tab.forward} disabled={!tab.canGoForward} title="Forward (Alt+Right)" aria-label="Forward">
        →
      </button>
      {tab.pending ? (
        <button onClick={tab.stop} title="Stop" aria-label="Stop">
          ✕
        </button>
      ) : (
        <button onClick={tab.reload} disabled={!tab.entry} title="Reload" aria-label="Reload">
          ↻
        </button>
      )}
    </div>
  );
}
