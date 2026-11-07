import { termPattern } from '@thinker/shared';

/** A window of text around the first place any of the terms occurs. */
export function snippet(text: string, terms: string[], width = 200): string {
  if (!text) return '';
  let at = -1;
  for (const t of terms) {
    const m = new RegExp(`\\b${termPattern(t)}\\b`, 'i').exec(text);
    if (m && (at < 0 || m.index < at)) at = m.index;
  }
  if (at < 0) at = 0;

  // Start a third of the way back from the match, on a word boundary.
  let start = Math.max(0, at - Math.floor(width / 3));
  if (start > 0) {
    const space = text.indexOf(' ', start);
    if (space >= 0 && space < at) start = space + 1;
  }
  let end = Math.min(text.length, start + width);
  if (end < text.length) {
    const space = text.lastIndexOf(' ', end);
    if (space > at) end = space;
  }
  return `${start > 0 ? '… ' : ''}${text.slice(start, end)}${end < text.length ? ' …' : ''}`;
}
