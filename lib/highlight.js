export function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function highlightPlainSegment(seg) {
  const numRe = /\b(?:0x[0-9a-fA-F]+|\d+(?:\.\d+)?(?:e[+-]?\d+)?)\b/g;
  const kw = 'break|case|catch|class|const|continue|debugger|default|delete|do|else|export|extends|finally|for|function|if|import|in|instanceof|let|new|return|super|switch|this|throw|try|typeof|var|void|while|with|yield|await|async|null|true|false|undefined';
  const kwRe = new RegExp('\\b(?:' + kw + ')\\b', 'g');
  let out = escapeHtml(seg);
  out = out.replace(kwRe, (m) => `<span class="tok-kw">${m}</span>`);
  out = out.replace(numRe, (m) => `<span class="tok-num">${m}</span>`);
  return out;
}

export function highlightJS(code) {
  const pattern = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|`(?:\\[\s\S]|[^\\`])*`|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*")/g;
  let lastIndex = 0;
  let html = '';
  let m;
  while ((m = pattern.exec(code))) {
    const idx = m.index;
    if (idx > lastIndex) {
      html += highlightPlainSegment(code.slice(lastIndex, idx));
    }
    const token = m[0];
    const cls = token.startsWith('/*') || token.startsWith('//') ? 'tok-com' : 'tok-str';
    html += `<span class="${cls}">${escapeHtml(token)}</span>`;
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < code.length) {
    html += highlightPlainSegment(code.slice(lastIndex));
  }
  return html;
}