/*
  Console Rules – Browser Popup
  - Save, edit, duplicate and delete named snippets
  - Execute snippets in the active page context
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
/** @type {string|null} */
let draggingId = null;

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
    li.draggable = true;
    li.innerHTML = `
      <div class="handle" title="Arrastar para reordenar" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" opacity="0.6">
          <circle cx="7" cy="7" r="1.5"/><circle cx="7" cy="12" r="1.5"/><circle cx="7" cy="17" r="1.5"/>
          <circle cx="12" cy="7" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="17" r="1.5"/>
        </svg>
      </div>
      <div class="content">
        <div class="title">${escapeHtml(s.name)}</div>
        <div class="meta">${new Date(s.updatedAt).toLocaleString()}</div>
      </div>
      <button class="icon-btn del-btn" title="Excluir" aria-label="Excluir snippet" data-action="delete" data-id="${s.id}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;
    li.addEventListener('click', () => selectSnippet(s.id));
    // Drag & drop reorder
    li.addEventListener('dragstart', (e) => {
      // Only allow when no search filter to avoid confusing partial reorder
      if ((searchEl.value || '').trim() !== '') {
        e.preventDefault();
        setStatus('Limpe a busca para reordenar');
        return;
      }
      draggingId = s.id;
      li.classList.add('dragging');
      try { e.dataTransfer && (e.dataTransfer.effectAllowed = 'move'); } catch {}
    });
    li.addEventListener('dragend', () => {
      li.classList.remove('dragging');
      draggingId = null;
      // Clean any transient styles
      Array.from(listEl.children).forEach((el) => el.classList && el.classList.remove('drag-over'));
    });
    // Bind delete button inside the list item
    const del = li.querySelector('button[data-action="delete"]');
    if (del) {
      del.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const id = del.getAttribute('data-id');
        if (id) deleteSnippetById(id);
      });
    }
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
  setStatus('Snippet salvo');
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

async function deleteSnippetById(id) {
  const s = snippets.find((x) => x.id === id);
  if (!s) return;
  if (!confirm(`Excluir "${s.name}"?`)) return;
  const wasActive = activeId === id;
  snippets = snippets.filter((x) => x.id !== id);
  await saveAll();
  if (wasActive) {
    activeId = snippets[0]?.id || null;
    if (activeId) selectSnippet(activeId); else { nameEl.value = ''; codeEl.value = ''; updateHighlight(); }
  }
  renderList();
  setStatus('Snippet excluído');
}

function withSourceURL(code, name) {
  const safe = name.replace(/[^\w.-]+/g, '_').slice(0, 50) || 'snippet';
  return `${code}\n//# sourceURL=ConsoleRules/${safe}.js`;
}

async function runSnippet() {
  const s = getActive();
  if (!s) return;
  
  try {
    await saveSnippet(); // persist edits before running
    
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      setStatus('Nenhuma aba ativa');
      return;
    }

    // Check if we can execute scripts on this tab
    if (tab.url?.startsWith('chrome://') || tab.url?.startsWith('chrome-extension://') || tab.url?.startsWith('edge://') || tab.url?.startsWith('about:')) {
      setStatus('Não é possível executar em páginas especiais');
      return;
    }

    const code = withSourceURL(s.code, s.name);
    
    // Execute the code in the active tab using MAIN world context
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world: 'MAIN',
      func: (codeToExecute) => {
        try {
          // Use Function constructor instead of eval to avoid CSP issues
          const fn = new Function(codeToExecute);
          const result = fn();
          return { success: true, result: result };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },
      args: [code]
    });

    const result = results[0]?.result;
    if (result?.success) {
      setStatus('Executado com sucesso');
    } else {
      setStatus(`Erro: ${result?.error || 'Erro desconhecido'}`);
    }
  } catch (error) {
    console.error('Console Rules error:', error);
    setStatus(`Erro: ${error.message}`);
  }
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

  // Drag & drop reorder on the list container
  listEl.addEventListener('dragover', (e) => {
    if (!draggingId) return;
    e.preventDefault();
    try { e.dataTransfer && (e.dataTransfer.dropEffect = 'move'); } catch {}
    const afterEl = getDragAfterElement(listEl, e.clientY);
    Array.from(listEl.children).forEach((el) => el.classList && el.classList.remove('drag-over'));
    if (afterEl) afterEl.classList.add('drag-over');
  });
  listEl.addEventListener('drop', async (e) => {
    if (!draggingId) return;
    e.preventDefault();
    const afterEl = getDragAfterElement(listEl, e.clientY);
    // Compute new order (only valid when search is empty)
    const fromIdx = snippets.findIndex((x) => x.id === draggingId);
    if (fromIdx === -1) return;
    const next = [...snippets];
    const [moved] = next.splice(fromIdx, 1);
    let insertIdx;
    if (!afterEl) {
      insertIdx = next.length; // place at end
    } else {
      const afterId = afterEl.dataset.id;
      insertIdx = next.findIndex((x) => x.id === afterId);
      if (insertIdx < 0) insertIdx = next.length;
    }
    next.splice(insertIdx, 0, moved);
    snippets = next;
    await saveAll();
    setStatus('Ordem atualizada');
    renderList();
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

// ----- Reorder helpers -----
function getDragAfterElement(container, y) {
  const els = [...container.querySelectorAll('li:not(.dragging)')];
  let closest = { offset: Number.NEGATIVE_INFINITY, element: null };
  for (const el of els) {
    const box = el.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      closest = { offset, element: el };
    }
  }
  return closest.element;
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
