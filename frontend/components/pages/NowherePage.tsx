'use client';

import { about, normalizeAddress } from '@thinker/shared';
import { Scroller } from './Scroller';
import type { SnapshotPageProps } from './types';

/** Where an address that leads nowhere lands: unpublished, outside this web, or not an address at all. */
export function NowherePage({ tab, entry, snap }: SnapshotPageProps<'nowhere'>) {
  const address = normalizeAddress(snap.input);
  return (
    <Scroller tab={tab} entry={entry} className="nowhere">
      <div className="big">∅</div>

      {snap.reason === 'missing' && (
        <>
          <h1>Nothing lives at {snap.input}</h1>
          <p>
            Nobody has ever published a page at this address, or nobody has yet. Links can point anywhere, including at
            places that never existed.
          </p>
          {address && (
            <p>
              <button className="primary" onClick={() => tab.navigate(about('publish', { address }), 'typed')}>
                Publish something at {address}
              </button>
            </p>
          )}
        </>
      )}

      {snap.reason === 'outside' && (
        <>
          <h1>This web has no outside</h1>
          <p>
            <code>{snap.input}</code> is an address on the real internet. Thinker only reaches its own web: addresses
            that end in <code>.zz</code>.
          </p>
        </>
      )}

      {snap.reason === 'malformed' && (
        <>
          <h1>That isn&apos;t an address</h1>
          <p>
            <code>{snap.input}</code> doesn&apos;t lead anywhere. Addresses look like <code>tidepool.zz</code>: letters,
            digits and hyphens, ending in <code>.zz</code>.
          </p>
        </>
      )}

      <p>
        <button onClick={tab.back} disabled={!tab.canGoBack}>
          ← Go back
        </button>
      </p>
    </Scroller>
  );
}
