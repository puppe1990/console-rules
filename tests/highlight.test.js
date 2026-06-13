import { describe, expect, it } from 'vitest';
import { escapeHtml, highlightJS } from '../lib/highlight.js';

describe('escapeHtml', () => {
  it('escapes HTML special characters', () => {
    expect(escapeHtml('<script>alert("x")</script>')).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;'
    );
  });

  it('escapes ampersands', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });
});

describe('highlightJS', () => {
  it('highlights keywords', () => {
    expect(highlightJS('const x = 1;')).toContain('<span class="tok-kw">const</span>');
  });

  it('highlights strings', () => {
    expect(highlightJS('const s = "hello";')).toContain('<span class="tok-str">&quot;hello&quot;</span>');
  });

  it('highlights line comments', () => {
    expect(highlightJS('// comment')).toContain('<span class="tok-com">// comment</span>');
  });

  it('highlights block comments', () => {
    expect(highlightJS('/* block */')).toContain('<span class="tok-com">/* block */</span>');
  });

  it('highlights numbers', () => {
    expect(highlightJS('const n = 42;')).toContain('<span class="tok-num">42</span>');
  });

  it('handles large multiline code', () => {
    const lines = Array.from({ length: 200 }, (_, i) => `const value${i} = ${i};`).join('\n');
    const html = highlightJS(lines);
    expect(html).toContain('<span class="tok-kw">const</span>');
    expect((html.match(/tok-num/g) || []).length).toBeGreaterThanOrEqual(200);
  });

  it('does not inject raw HTML from user input', () => {
    const html = highlightJS('<img onerror=alert(1)>');
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
  });
});