'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { normalizeAddress, type Revision } from '@thinker/shared';
import { api, errorMessage } from '@/lib/api';
import { getEditKey, saveEditKey } from '@/lib/edit-keys';
import type { Draft } from '@/lib/snapshot';
import { PageFrame } from '../frame/PageFrame';
import { Scroller } from './Scroller';
import type { SnapshotPageProps } from './types';

const STARTER = `<h1>My page</h1>
<p>Write anything. Link to other sites by address, like <a href="tidepool.zz">tidepool.zz</a>.</p>`;
const DRAFT_SAVE_MS = 300;
const LOOKUP_DELAY_MS = 250;
const MAX_TITLE_LENGTH = 120;

/** What the address field currently points at, from the publisher's side. */
type Ownership =
  | { kind: 'none' }
  | { kind: 'free'; address: string }
  | { kind: 'taken'; address: string; ownerName: string }
  | { kind: 'mine'; address: string; current: Revision };

/** Looks up who owns an address, a moment after the publisher stops typing. */
function useOwnership(address: string | null, authorId: string): Ownership {
  const [ownership, setOwnership] = useState<Ownership>({ kind: 'none' });
  useEffect(() => {
    setOwnership({ kind: 'none' });
    if (!address) return;
    let live = true;
    const t = setTimeout(async () => {
      const rev = await api.resolve(address).catch(() => null);
      if (!live) return;
      if (!rev) setOwnership({ kind: 'free', address });
      else if (rev.authorId !== authorId) setOwnership({ kind: 'taken', address, ownerName: rev.authorName });
      else setOwnership({ kind: 'mine', address, current: rev });
    }, LOOKUP_DELAY_MS);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [address, authorId]);
  return ownership;
}

/** about:publish — an address and a page of HTML, previewed in the same sandbox readers get. */
export function PublishPage({ tab, entry, snap }: SnapshotPageProps<'publish'>) {
  const [draft, setDraft] = useState<Draft>(snap.draft);
  const [preview, setPreview] = useState(snap.draft.html);
  const [editKey, setEditKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const address = normalizeAddress(draft.address);
  const ownership = useOwnership(address, draft.authorId);
  const editing = ownership.kind === 'mine' && ownership.address === address;
  const authorName = tab.people.find((p) => p.id === draft.authorId)?.name ?? draft.authorId;

  /** The draft lives on the entry, so leaving and coming back finds it as it was. */
  const keepDraft = (next: Draft) => tab.patchEntry(entry.key, { snapshot: { kind: 'publish', draft: next } });

  const update = (patch: Partial<Draft>) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      keepDraft(next);
      setPreview(next.html);
    }, DRAFT_SAVE_MS);
  };
  useEffect(() => () => clearTimeout(saveTimer.current), []);

  // Editing your own site: offer its saved key, and start from what is published if the draft is empty.
  useEffect(() => {
    if (ownership.kind !== 'mine') return;
    setEditKey(getEditKey(ownership.address) ?? '');
    if (draft.html || draft.title) return;
    let live = true;
    api.source(ownership.current.id).then(({ source }) => {
      if (!live) return;
      const next = { ...draft, title: ownership.current.title, html: source };
      setDraft(next);
      setPreview(source);
      keepDraft(next);
    });
    return () => {
      live = false;
    };
    // Only when ownership is first established for an address.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownership]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      clearTimeout(saveTimer.current);
      keepDraft(draft);
      const key = editing ? editKey.trim() : undefined;
      const rev = await api.publish({ ...draft, html: draft.html || STARTER, editKey: key });
      // A fresh claim hands back the key; a key the server accepted is worth keeping too.
      if (rev.editKey) saveEditKey(rev.address, rev.editKey);
      else if (key) saveEditKey(rev.address, key);
      await tab.navigate({ kind: 'site', address: rev.address }, 'publish');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Scroller tab={tab} entry={entry}>
      <h1>Publish a site</h1>
      <p className="muted">
        An address and a page of HTML. Scripts, forms, embeds and images are removed when you publish; your CSS stays.
        The preview runs in the same sandbox readers will see it in. Claiming an address gives this browser its edit
        key; publishing there again needs it.
      </p>

      <form className="publish" onSubmit={submit}>
        <label>
          Publishing as
          <select value={draft.authorId} onChange={(e) => update({ authorId: e.target.value })}>
            {tab.people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Address
          <input
            value={draft.address}
            onChange={(e) => update({ address: e.target.value })}
            placeholder="yourname.zz"
            spellCheck={false}
            required
          />
        </label>
        {draft.address && !address && <p className="warn">Addresses look like name.zz: letters, digits and hyphens.</p>}
        <OwnershipNote ownership={ownership} authorName={authorName} />

        {editing && ownership.kind === 'mine' && (
          <EditKeyField address={ownership.address} value={editKey} onChange={setEditKey} />
        )}

        <label>
          Title
          <input
            value={draft.title}
            onChange={(e) => update({ title: e.target.value })}
            maxLength={MAX_TITLE_LENGTH}
            required
          />
        </label>

        <label>
          HTML
          <textarea
            value={draft.html}
            onChange={(e) => update({ html: e.target.value })}
            placeholder={STARTER}
            rows={14}
            spellCheck={false}
          />
        </label>

        {error && <p className="warn">{error}</p>}
        <div className="row">
          <button className="primary" disabled={busy || !address}>
            {busy ? 'Publishing…' : 'Publish'}
          </button>
        </div>
      </form>

      <h2>Preview</h2>
      <div className="preview">
        <PageFrame key={preview} html={preview || STARTER} title={draft.title || 'Preview'} />
      </div>
    </Scroller>
  );
}

function OwnershipNote({ ownership, authorName }: { ownership: Ownership; authorName: string }) {
  switch (ownership.kind) {
    case 'none':
      return null;
    case 'free':
      return <p className="note">{`${ownership.address} is free. Publishing claims it for ${authorName}.`}</p>;
    case 'taken':
      return <p className="note">{`${ownership.address} belongs to ${ownership.ownerName}. Only they can publish there.`}</p>;
    case 'mine': {
      const n = ownership.current.n;
      return (
        <p className="note">
          {`Editing ${ownership.address}. Publishing adds revision ${n + 1}; anyone with revision ${n} in their back history keeps it.`}
        </p>
      );
    }
  }
}

function EditKeyField({ address, value, onChange }: { address: string; value: string; onChange: (v: string) => void }) {
  return (
    <label>
      Edit key
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="The key handed out when this address was claimed"
        autoComplete="off"
        spellCheck={false}
        required
      />
      <span className="hint">
        {getEditKey(address)
          ? 'This browser kept the key when the site was published here.'
          : 'Not saved in this browser. Seeded sites’ keys are in .data/edit-keys.json.'}
      </span>
    </label>
  );
}
