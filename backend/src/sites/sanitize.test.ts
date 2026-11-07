import { describe, expect, it } from 'vitest';
import { SITES } from '../seed/sites.data';
import { extractText, sanitize } from './sanitize';

describe('sanitize', () => {
  const escape = sanitize(SITES.find((s) => s.address === 'escape.zz')!.revisions[0].html);

  it.each([
    ['<script', /<script/i],
    ['event handlers', /\son\w+\s*=/i],
    ['forms', /<form|<input|<button/i],
    ['frames and embeds', /<iframe|<object|<embed/i],
    ['meta refresh', /<meta/i],
    ['base href', /<base/i],
    ['javascript: urls', /href="\s*javascript:/i],
    ['links into the browser chrome', /href="about:/i],
    ['link targets', /<a[^>]*\starget=/i],
  ])('removes %s', (_, pattern) => expect(escape).not.toMatch(pattern));

  it('keeps prose, links to addresses, fragments and the author’s CSS', () => {
    expect(escape).toContain('<h1');
    expect(escape).toContain('href="ring.zz"');
    expect(escape).toContain('href="#nowhere"');
    expect(escape).toContain('<style>');
  });

  it('keeps links to the outside so the browser can say they lead nowhere', () => {
    expect(sanitize('<a href="https://example.org/x">out</a>')).toBe('<a href="https://example.org/x">out</a>');
  });

  it('cannot be broken out of with a closing style tag', () => {
    const out = sanitize('<style>p{}</style><script>alert(1)</script><p>ok</p>');
    expect(out).not.toMatch(/<script/i);
  });
});

describe('extractText', () => {
  it('extracts readable text with spaces between blocks', () => {
    expect(extractText('<style>.x{}</style><h1>Kelp</h1><p>grows&nbsp;fast &amp; tall</p>')).toBe('Kelp grows fast & tall');
  });
});
