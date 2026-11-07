'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { about, parseTyped } from '@smallweb/shared';
import { Theme, useTheme } from '@/lib/theme';
import { useTab } from '@/lib/useTab';
import { Page } from './pages';

const THEME_ICON: Record<Theme, string> = { system: '◐', light: '☀', dark: '☾' };
const THEME_LABEL: Record<Theme, string> = { system: 'match system', light: 'light', dark: 'dark' };

export function Browser() {
  const tab = useTab();
  const theme = useTheme();
  const { entry, pending, people, personId } = tab;
  const [draft, setDraft] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  // A new entry (or a traversal) replaces whatever was being typed.
  useEffect(() => setDraft(null), [entry?.key]);

  // Ctrl/Cmd+L focuses the address bar, as everywhere else.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        input.current?.focus();
        input.current?.select();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const target = parseTyped(draft ?? '');
    if (!target) return;
    setDraft(null);
    input.current?.blur();
    tab.navigate(target, 'typed');
  };

  const shown = draft ?? pending ?? entry?.address ?? '';
  const snap = entry?.snapshot;

  return (
    <div className="browser">
      <header className="chrome">
        <div className="toolbar">
          <div className="nav-buttons">
            <button onClick={tab.back} disabled={!tab.canGoBack} title="Back (Alt+Left)" aria-label="Back">
              ←
            </button>
            <button onClick={tab.forward} disabled={!tab.canGoForward} title="Forward (Alt+Right)" aria-label="Forward">
              →
            </button>
            {pending ? (
              <button onClick={tab.stop} title="Stop" aria-label="Stop">
                ✕
              </button>
            ) : (
              <button onClick={tab.reload} disabled={!entry} title="Reload" aria-label="Reload">
                ↻
              </button>
            )}
          </div>
          <form className="address" onSubmit={submit}>
            <span className={`scheme ${snap?.kind === 'site' ? 'web' : snap?.kind === 'nowhere' ? 'nowhere' : 'internal'}`}>
              {snap?.kind === 'site' ? 'zz' : snap?.kind === 'nowhere' ? '∅' : '⌂'}
            </span>
            <input
              ref={input}
              value={shown}
              onChange={(e) => setDraft(e.target.value)}
              onFocus={(e) => e.target.select()}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setDraft(null);
                  e.currentTarget.blur();
                }
              }}
              placeholder="Type an address like tidepool.zz, or search"
              spellCheck={false}
              autoComplete="off"
              aria-label="Address"
            />
          </form>
          <div className="tools">
            <button onClick={() => tab.navigate(about('home'), 'typed')} title="Start page">
              Start
            </button>
            <button onClick={() => tab.navigate(about('history'), 'typed')} title="History">
              History
            </button>
            <button onClick={() => tab.navigate(about('publish'), 'typed')} title="Publish a site">
              Publish
            </button>
            <button
              className="theme-toggle"
              onClick={theme.cycle}
              title={`Theme: ${THEME_LABEL[theme.theme]} (click to change)`}
              aria-label={`Theme: ${THEME_LABEL[theme.theme]}`}
            >
              {THEME_ICON[theme.theme]}
            </button>
            <label className="person" title="Who is browsing">
              <span aria-hidden>●</span>
              <select value={personId ?? ''} onChange={(e) => tab.switchPerson(e.target.value)} aria-label="Browsing as">
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        <div className={`progress ${pending ? 'on' : ''}`} />
        {tab.error && (
          <div className="errorbar" role="alert">
            {tab.error}
            <button onClick={tab.dismissError}>Dismiss</button>
          </div>
        )}
      </header>
      <main className="viewport">{entry ? <Page key={entry.key} tab={tab} entry={entry} /> : <div className="booting">Starting…</div>}</main>
    </div>
  );
}
