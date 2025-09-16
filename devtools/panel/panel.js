/*
  Console Rules – DevTools Panel
  - Save, edit, duplicate and delete named snippets
  - Execute snippets in the inspected page context (like typing in Console)
  - Persist snippets in chrome.storage.sync
*/

// Storage helpers
const STORAGE_KEY = 'consoleRules.snippets';

/** @typedef {{ id: string, name: string, code: string, updatedAt: number }} Snippet */

const $ = (sel) => document.querySelector(sel);
const listEl = $('#snippetList');
const searchEl = $('#searchInput');
const nameEl = $('#nameInput');
const codeEl = $('#codeInput');
const statusEl = $('#status');
const highlightPre = document.querySelector('#highlighting');
const highlightCode = document.querySelector('#highlighting-content');

const newBtn = $('#newSnippetBtn');
const runBtn = $('#runSnippetBtn');
const saveBtn = $('#saveSnippetBtn');
const dupBtn = $('#duplicateSnippetBtn');
const delBtn = $('#deleteSnippetBtn');
const exportBtn = $('#exportBtn');
const importBtn = $('#importBtn');
const importFile = $('#importFile');

/** @type {Snippet[]} */
let snippets = [];
/** @type {string|null} */
let activeId = null;

function uid() { return Math.random().toString(36).slice(2, 10); }
function now() { return Date.now(); }

async function loadSnippets() {
  const res = await chrome.storage.sync.get(STORAGE_KEY);
  snippets = res[STORAGE_KEY] || [];
  if (snippets.length === 0) {
    const initial = /** @type {Snippet} */ ({
      id: uid(),
      name: 'Exemplo: Olá Console',
      code: "console.log('Olá do Console Rules!');",
      updatedAt: now(),
    });
    snippets = [initial];
    await saveAll();
  }
}

async function saveAll() {
  await chrome.storage.sync.set({ [STORAGE_KEY]: snippets });
}

function setStatus(msg) {
  statusEl.textContent = msg;
  if (!msg) return;
  setTimeout(() => { if (statusEl.textContent === msg) statusEl.textContent = ''; }, 2000);
}

function renderList() {
  const q = (searchEl.value || '').toLowerCase();
  listEl.innerHTML = '';
  for (const s of snippets) {
    if (q && !s.name.toLowerCase().includes(q)) continue;
    const li = document.createElement('li');
    li.dataset.id = s.id;
    li.className = s.id === activeId ? 'active' : '';
    li.innerHTML = `
      <div class="title">${escapeHtml(s.name)}</div>
      <div class="meta">${new Date(s.updatedAt).toLocaleString()}</div>
    `;
    li.addEventListener('click', () => selectSnippet(s.id));
    listEl.appendChild(li);
  }
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;' }[c]));
}

function selectSnippet(id) {
  const s = snippets.find((x) => x.id === id);
  if (!s) return;
  activeId = id;
  nameEl.value = s.name;
  codeEl.value = s.code;
  updateHighlight();
  renderList();
}

function getActive() { return snippets.find((x) => x.id === activeId) || null; }

async function addSnippet() {
  const s = /** @type {Snippet} */ ({ id: uid(), name: 'Novo snippet', code: '', updatedAt: now() });
  snippets.unshift(s);
  await saveAll();
  selectSnippet(s.id);
  renderList();
}

async function saveSnippet() {
  const s = getActive();
  if (!s) return;
  s.name = nameEl.value.trim() || 'Sem título';
  s.code = codeEl.value;
  s.updatedAt = now();
  await saveAll();
  setStatus('Snippets salvos');
  renderList();
}

async function duplicateSnippet() {
  const s = getActive();
  if (!s) return;
  const copy = /** @type {Snippet} */ ({
    id: uid(),
    name: s.name + ' (cópia)',
    code: s.code,
    updatedAt: now(),
  });
  snippets.unshift(copy);
  await saveAll();
  selectSnippet(copy.id);
  renderList();
}

async function deleteSnippet() {
  const s = getActive();
  if (!s) return;
  if (!confirm(`Excluir "${s.name}"?`)) return;
  snippets = snippets.filter((x) => x.id !== s.id);
  await saveAll();
  activeId = snippets[0]?.id || null;
  if (activeId) selectSnippet(activeId); else { nameEl.value = ''; codeEl.value = ''; }
  renderList();
}

function withSourceURL(code, name) {
  const safe = name.replace(/[^\w.-]+/g, '_').slice(0, 50) || 'snippet';
  return `${code}\n//# sourceURL=ConsoleRules/${safe}.js`;
}

async function runSnippet() {
  const s = getActive();
  if (!s) return;
  await saveSnippet(); // persist edits before running
  const code = withSourceURL(s.code, s.name);
  // Execute in the inspected window context (like typing in Console)
  chrome.devtools.inspectedWindow.eval(
    code,
    { useContentScriptContext: false },
    (result, exceptionInfo) => {
      if (exceptionInfo && (exceptionInfo.isException || exceptionInfo.value)) {
        const msg = exceptionInfo.value?.description || exceptionInfo.value || 'Erro ao executar';
        setStatus(String(msg));
        console.warn('Console Rules error:', exceptionInfo);
      } else {
        setStatus('Executado');
        // Show the result in DevTools console for convenience
        try { console.log('[Console Rules]', result); } catch {}
      }
    }
  );
}

function bindEvents() {
  searchEl.addEventListener('input', renderList);
  newBtn.addEventListener('click', addSnippet);
  runBtn.addEventListener('click', runSnippet);
  saveBtn.addEventListener('click', saveSnippet);
  dupBtn.addEventListener('click', duplicateSnippet);
  delBtn.addEventListener('click', deleteSnippet);
  exportBtn.addEventListener('click', exportSnippets);
  importBtn.addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', handleImportFile);

  // Editor events: input, scroll sync, Tab/Enter helpers
  codeEl.addEventListener('input', () => {
    updateHighlight();
  });
  codeEl.addEventListener('scroll', () => {
    highlightPre.scrollTop = codeEl.scrollTop;
    highlightPre.scrollLeft = codeEl.scrollLeft;
  });
  codeEl.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      insertTextAtCursor('  ');
      return;
    }
    if (e.key === 'Enter') {
      // auto-indent: copy leading spaces of current line
      const { value, selectionStart } = codeEl;
      const start = value.lastIndexOf('\n', selectionStart - 1) + 1;
      const line = value.slice(start, selectionStart);
      const indent = (line.match(/^\s+/) || [''])[0];
      requestAnimationFrame(() => {
        insertTextAtCursor(indent);
      });
    }
  });

  // Ctrl/Cmd+S to save, Ctrl/Cmd+Enter to run
  document.addEventListener('keydown', (e) => {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key === 's') { e.preventDefault(); saveSnippet(); }
    if (mod && (e.key === 'Enter' || e.code === 'Enter')) { e.preventDefault(); runSnippet(); }
  });
}

(async function init() {
  await loadSnippets();
  activeId = snippets[0]?.id || null;
  bindEvents();
  renderList();
  if (activeId) selectSnippet(activeId);
})();

// ----- Syntax highlighting (lightweight) -----
function updateHighlight() {
  const code = codeEl.value;
  if (!highlightCode) return;
  highlightCode.innerHTML = highlightJS(code);
  if (code.endsWith('\n')) highlightCode.innerHTML += ' ';
}

function highlightPlainSegment(seg) {
  // numbers
  const numRe = /\b(?:0x[0-9a-fA-F]+|\d+(?:\.\d+)?(?:e[+-]?\d+)?)\b/g;
  // keywords and literals
  const kw = 'break|case|catch|class|const|continue|debugger|default|delete|do|else|export|extends|finally|for|function|if|import|in|instanceof|let|new|return|super|switch|this|throw|try|typeof|var|void|while|with|yield|await|async|null|true|false|undefined';
  const kwRe = new RegExp('\\b(?:' + kw + ')\\b', 'g');
  let out = escapeHtml(seg);
  out = out.replace(kwRe, m => `<span class="tok-kw">${m}</span>`);
  out = out.replace(numRe, m => `<span class="tok-num">${m}</span>`);
  return out;
}

function highlightJS(code) {
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

function insertTextAtCursor(text) {
  const start = codeEl.selectionStart;
  const end = codeEl.selectionEnd;
  const value = codeEl.value;
  codeEl.value = value.slice(0, start) + text + value.slice(end);
  const pos = start + text.length;
  codeEl.selectionStart = codeEl.selectionEnd = pos;
  updateHighlight();
}

// ----- Export / Import -----
function exportSnippets() {
  const payload = {
    type: 'console-rules-snippets',
    version: 1,
    exportedAt: new Date().toISOString(),
    count: snippets.length,
    snippets: snippets.map(({ id, name, code, updatedAt }) => ({ id, name, code, updatedAt })),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  a.download = `console-rules-snippets-${ts}.json`;
  a.href = URL.createObjectURL(blob);
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 0);
  setStatus('Exportado');
}

async function handleImportFile(e) {
  const file = e.target.files && e.target.files[0];
  importFile.value = '';
  if (!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    let imported = Array.isArray(data) ? data : (Array.isArray(data?.snippets) ? data.snippets : []);
    if (!Array.isArray(imported)) throw new Error('Arquivo inválido');
    const cleaned = [];
    for (const item of imported) {
      if (!item || typeof item.code !== 'string') continue;
      const name = (item.name && String(item.name)) || 'Sem título';
      const code = String(item.code);
      const updatedAt = Number(item.updatedAt) || now();
      cleaned.push({ id: uid(), name, code, updatedAt });
    }
    if (cleaned.length === 0) throw new Error('Nada para importar');

    // Merge: prepend imported, keep existing
    snippets = [...cleaned, ...snippets];
    await saveAll();
    activeId = cleaned[0].id;
    selectSnippet(activeId);
    renderList();
    setStatus(`Importados ${cleaned.length}`);
  } catch (err) {
    console.warn('Falha ao importar', err);
    alert('Falha ao importar: ' + (err && err.message ? err.message : String(err)));
  }
}
