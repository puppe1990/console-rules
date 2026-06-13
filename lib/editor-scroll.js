import { highlightJS } from './highlight.js';

export function countLines(code) {
  if (!code) return 1;
  let lines = 1;
  for (let i = 0; i < code.length; i++) {
    if (code.charCodeAt(i) === 10) lines++;
  }
  return lines;
}

export function buildLineNumbersHtml(lineCount) {
  const parts = [];
  for (let i = 1; i <= lineCount; i++) {
    parts.push(`<span class="line-number">${i}</span>`);
  }
  return parts.join('');
}

export function getLineGutterWidth(lineCount) {
  const digits = Math.max(2, String(lineCount).length);
  return `calc(${digits}ch + 24px)`;
}

export function applyHighlightHtml(highlightCode, code) {
  if (!highlightCode) return;
  highlightCode.innerHTML = highlightJS(code);
  if (code.endsWith('\n')) highlightCode.innerHTML += ' ';
}

export function syncHighlightDimensions(codeEl, highlightCode) {
  if (!codeEl || !highlightCode) return;
  highlightCode.style.minHeight = `${codeEl.scrollHeight}px`;
  highlightCode.style.minWidth = `${Math.max(codeEl.scrollWidth, codeEl.clientWidth)}px`;
}

export function syncLineNumbersDimensions(codeEl, lineNumbersContent, editorEl) {
  if (!codeEl || !lineNumbersContent) return;
  lineNumbersContent.style.minHeight = `${codeEl.scrollHeight}px`;
  if (editorEl) {
    editorEl.style.setProperty('--line-gutter-width', getLineGutterWidth(countLines(codeEl.value)));
  }
}

export function updateLineNumbers(codeEl, lineNumbersContent, editorEl) {
  if (!lineNumbersContent) return;
  const lineCount = countLines(codeEl?.value ?? '');
  lineNumbersContent.innerHTML = buildLineNumbersHtml(lineCount);
  syncLineNumbersDimensions(codeEl, lineNumbersContent, editorEl);
}

export function syncHighlightScroll(codeEl, highlightCode, lineNumbersContent) {
  if (!codeEl) return;
  const x = codeEl.scrollLeft;
  const y = codeEl.scrollTop;
  if (highlightCode) {
    highlightCode.style.transform = `translate(${-x}px, ${-y}px)`;
  }
  if (lineNumbersContent) {
    lineNumbersContent.style.transform = `translateY(${-y}px)`;
  }
}

export function ensureEditorScrollable(codeEl) {
  if (!codeEl) return;
  void codeEl.offsetHeight;
  if (codeEl.scrollHeight > codeEl.clientHeight) {
    codeEl.style.overflowY = 'scroll';
  }
}

export function updateEditorHighlight(codeEl, highlightCode, lineNumbersContent, editorEl) {
  if (!codeEl || !highlightCode) return;
  applyHighlightHtml(highlightCode, codeEl.value);
  updateLineNumbers(codeEl, lineNumbersContent, editorEl);
  syncHighlightDimensions(codeEl, highlightCode);
  syncHighlightScroll(codeEl, highlightCode, lineNumbersContent);
  requestAnimationFrame(() => {
    syncHighlightDimensions(codeEl, highlightCode);
    syncLineNumbersDimensions(codeEl, lineNumbersContent, editorEl);
    ensureEditorScrollable(codeEl);
    syncHighlightScroll(codeEl, highlightCode, lineNumbersContent);
  });
}

export function refreshEditorScroll(codeEl, highlightCode, lineNumbersContent, editorEl) {
  if (!codeEl || !highlightCode) return;
  void codeEl.offsetHeight;
  updateLineNumbers(codeEl, lineNumbersContent, editorEl);
  syncHighlightDimensions(codeEl, highlightCode);
  syncLineNumbersDimensions(codeEl, lineNumbersContent, editorEl);
  ensureEditorScrollable(codeEl);
  syncHighlightScroll(codeEl, highlightCode, lineNumbersContent);
}