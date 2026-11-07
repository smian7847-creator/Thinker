'use client';

import { about, type AboutPage } from '@thinker/shared';
import { useTab } from '@/hooks/useTab';
import { Page } from '../pages/Page';
import { AddressBar } from './AddressBar';
import { NavButtons } from './NavButtons';
import { PersonPicker } from './PersonPicker';
import { ThemeToggle } from './ThemeToggle';

const SHORTCUTS: { page: AboutPage; label: string; title: string }[] = [
  { page: 'home', label: 'Start', title: 'Start page' },
  { page: 'history', label: 'History', title: 'History' },
  { page: 'publish', label: 'Publish', title: 'Publish a site' },
];

/** The whole browser: chrome on top, the current entry's page below. */
export function Browser() {
  const tab = useTab();
  const { entry, pending, error } = tab;

  return (
    <div className="browser">
      <header className="chrome">
        <div className="toolbar">
          <NavButtons tab={tab} />
          <AddressBar tab={tab} />
          <div className="tools">
            {SHORTCUTS.map(({ page, label, title }) => (
              <button key={page} onClick={() => tab.navigate(about(page), 'typed')} title={title}>
                {label}
              </button>
            ))}
            <ThemeToggle />
            <PersonPicker tab={tab} />
          </div>
        </div>
        <div className={`progress ${pending ? 'on' : ''}`} />
        {error && (
          <div className="errorbar" role="alert">
            {error}
            <button onClick={tab.dismissError}>Dismiss</button>
          </div>
        )}
      </header>
      <main className="viewport">
        {entry ? <Page key={entry.key} tab={tab} entry={entry} /> : <div className="booting">Starting…</div>}
      </main>
    </div>
  );
}
