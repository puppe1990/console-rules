import { beforeEach, describe, expect, it } from 'vitest';
import {
  applyHighlightHtml,
  buildLineNumbersHtml,
  countLines,
  ensureEditorScrollable,
  getLineGutterWidth,
  refreshEditorScroll,
  syncHighlightDimensions,
  syncHighlightScroll,
  updateEditorHighlight,
  updateLineNumbers,
} from '../lib/editor-scroll.js';

function createEditorFixture() {
  document.body.innerHTML = `
    <div class="code-editor" id="codeEditor" style="position:relative;width:400px;height:200px;overflow:hidden;--line-gutter-width:calc(3ch + 24px);">
      <div class="line-numbers" style="position:absolute;left:0;top:0;bottom:0;width:var(--line-gutter-width);overflow:hidden;">
        <div id="line-numbers-content" class="line-numbers-content"></div>
      </div>
      <pre id="highlighting" style="position:absolute;inset:0;overflow:hidden;margin:0;padding:16px;">
        <code id="highlighting-content"></code>
      </pre>
      <textarea id="codeInput" style="position:absolute;inset:0;margin:0;padding:16px;overflow:auto;resize:none;"></textarea>
    </div>
  `;
  const codeEl = document.getElementById('codeInput');
  const highlightCode = document.getElementById('highlighting-content');
  const lineNumbersContent = document.getElementById('line-numbers-content');
  const editorEl = document.getElementById('codeEditor');
  return { codeEl, highlightCode, lineNumbersContent, editorEl };
}

describe('line numbers', () => {
  it('countLines returns 1 for empty code', () => {
    expect(countLines('')).toBe(1);
  });

  it('countLines counts logical lines', () => {
    expect(countLines('a')).toBe(1);
    expect(countLines('a\nb')).toBe(2);
    expect(countLines('a\n')).toBe(2);
    expect(countLines('a\nb\nc')).toBe(3);
  });

  it('buildLineNumbersHtml renders sequential numbers', () => {
    expect(buildLineNumbersHtml(3)).toBe(
      '<span class="line-number">1</span><span class="line-number">2</span><span class="line-number">3</span>'
    );
  });

  it('getLineGutterWidth grows with digit count', () => {
    expect(getLineGutterWidth(9)).toBe('calc(2ch + 24px)');
    expect(getLineGutterWidth(100)).toBe('calc(3ch + 24px)');
    expect(getLineGutterWidth(1000)).toBe('calc(4ch + 24px)');
  });

  it('updateLineNumbers renders numbers and syncs gutter width', () => {
    const { codeEl, lineNumbersContent, editorEl } = createEditorFixture();
    codeEl.value = 'one\ntwo\nthree';
    Object.defineProperty(codeEl, 'scrollHeight', { value: 120, configurable: true });

    updateLineNumbers(codeEl, lineNumbersContent, editorEl);

    expect(lineNumbersContent.innerHTML).toContain('line-number">1</span>');
    expect(lineNumbersContent.innerHTML).toContain('line-number">3</span>');
    expect(editorEl.style.getPropertyValue('--line-gutter-width')).toBe('calc(2ch + 24px)');
    expect(lineNumbersContent.style.minHeight).toBe('120px');
  });
});

describe('editor scroll helpers', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('applyHighlightHtml renders syntax spans', () => {
    const { codeEl, highlightCode } = createEditorFixture();
    codeEl.value = 'const x = 1;';
    applyHighlightHtml(highlightCode, codeEl.value);
    expect(highlightCode.innerHTML).toContain('tok-kw');
  });

  it('syncHighlightScroll mirrors textarea scroll via transform', () => {
    const { codeEl, highlightCode, lineNumbersContent } = createEditorFixture();
    codeEl.scrollTop = 120;
    codeEl.scrollLeft = 30;
    syncHighlightScroll(codeEl, highlightCode, lineNumbersContent);
    expect(highlightCode.style.transform).toBe('translate(-30px, -120px)');
    expect(lineNumbersContent.style.transform).toBe('translateY(-120px)');
  });

  it('syncHighlightDimensions sets minHeight from textarea scrollHeight', () => {
    const { codeEl, highlightCode } = createEditorFixture();
    codeEl.value = Array.from({ length: 100 }, (_, i) => `line ${i}`).join('\n');
    Object.defineProperty(codeEl, 'scrollHeight', { value: 2400, configurable: true });
    syncHighlightDimensions(codeEl, highlightCode);
    expect(highlightCode.style.minHeight).toBe('2400px');
  });

  it('ensureEditorScrollable enables vertical scroll when content overflows', () => {
    const { codeEl } = createEditorFixture();
    Object.defineProperty(codeEl, 'scrollHeight', { value: 500, configurable: true });
    Object.defineProperty(codeEl, 'clientHeight', { value: 200, configurable: true });
    ensureEditorScrollable(codeEl);
    expect(codeEl.style.overflowY).toBe('scroll');
  });

  it('updateEditorHighlight keeps highlight layer aligned for large code', () => {
    const { codeEl, highlightCode, lineNumbersContent, editorEl } = createEditorFixture();
    const largeCode = Array.from({ length: 300 }, (_, i) => `const line${i} = ${i};`).join('\n');
    codeEl.value = largeCode;
    Object.defineProperty(codeEl, 'scrollHeight', { value: 4800, configurable: true });
    Object.defineProperty(codeEl, 'clientHeight', { value: 200, configurable: true });

    updateEditorHighlight(codeEl, highlightCode, lineNumbersContent, editorEl);

    expect(highlightCode.innerHTML).toContain('tok-kw');
    expect(highlightCode.style.minHeight).toBe('4800px');
    expect(lineNumbersContent.innerHTML).toContain('line-number">300</span>');
    expect(highlightCode.style.transform).toBe('translate(0px, 0px)');
  });

  it('refreshEditorScroll re-syncs dimensions and scroll state', () => {
    const { codeEl, highlightCode, lineNumbersContent, editorEl } = createEditorFixture();
    codeEl.value = 'line\n'.repeat(50);
    Object.defineProperty(codeEl, 'scrollHeight', { value: 1200, configurable: true });
    Object.defineProperty(codeEl, 'clientHeight', { value: 200, configurable: true });
    codeEl.scrollTop = 400;

    refreshEditorScroll(codeEl, highlightCode, lineNumbersContent, editorEl);

    expect(highlightCode.style.minHeight).toBe('1200px');
    expect(highlightCode.style.transform).toBe('translate(0px, -400px)');
    expect(lineNumbersContent.style.transform).toBe('translateY(-400px)');
    expect(codeEl.style.overflowY).toBe('scroll');
  });
});