import { termPattern } from '@thinker/shared';

/** Text with the search terms marked, matched exactly as the backend matched them. */
export function Highlight({ text, terms }: { text: string; terms: string[] }) {
  if (!terms.length) return <>{text}</>;
  const re = new RegExp(`\\b(${terms.map(termPattern).join('|')})\\b`, 'giu');
  const parts = text.split(re);
  return <>{parts.map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : part))}</>;
}
