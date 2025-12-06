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
const languageSelector = $('#languageSelector');
const fullscreenBtn = $('#fullscreenBtn');
const urlParams = new URLSearchParams(location.search);
const isFullscreenPage = urlParams.get('fullscreen') === '1';

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
const AUTOSAVE_MS = 500;
/** @type {number|null} */
let autosaveTimer = null;
let hasPendingSave = false;
let localFallbackNotified = false;
let isFullscreen = false;

function uid() { return Math.random().toString(36).slice(2, 10); }
function now() { return Date.now(); }

async function loadSnippets() {
  const [syncRes, localRes] = await Promise.all([
    chrome.storage.sync.get(STORAGE_KEY),
    chrome.storage.local.get(LOCAL_STORAGE_KEY),
  ]);
  const localSnippets = localRes[LOCAL_STORAGE_KEY];
  const syncSnippets = syncRes[STORAGE_KEY];
  snippets = (Array.isArray(localSnippets) && localSnippets.length > 0)
    ? localSnippets
    : (syncSnippets || []);
  if (Array.isArray(localSnippets) && localSnippets.length > 0) {
    localFallbackNotified = true;
    setStatus(translator.t('loadedFromLocal'));
  }
  if (snippets.length === 0) {
    const initial = /** @type {Snippet} */ ({
      id: uid(),
      name: translator.t('exampleSnippetName'),
      code: translator.t('exampleSnippetCode'),
      updatedAt: now(),
    });
    snippets = [initial];
    await saveAll();
  }
}

const LOCAL_STORAGE_KEY = 'consoleRules.snippets.local';
const SYNC_SAFE_BYTES = 7500; // soft cap to avoid per-item quota hits

function isQuotaError(err) {
  const msg = (err && err.message ? err.message : String(err || '')).toLowerCase();
  return msg.includes('quota') || msg.includes('kquotabytesperitem');
}

function estimateBytes(obj) {
  try {
    return new TextEncoder().encode(JSON.stringify(obj)).length;
  } catch {
    return Infinity;
  }
}

async function saveAll() {
  const payload = { [STORAGE_KEY]: snippets };
  const bytes = estimateBytes(payload);
  const preferLocal = bytes > SYNC_SAFE_BYTES;
  try {
    if (!preferLocal) {
      await chrome.storage.sync.set(payload);
      await chrome.storage.local.remove(LOCAL_STORAGE_KEY);
      hasPendingSave = false;
      localFallbackNotified = false;
      return;
    }
  } catch (err) {
    if (!isQuotaError(err)) {
      hasPendingSave = true;
      throw err;
    }
  }

  // Fallback to local storage when sync is too small
  await chrome.storage.local.set({ [LOCAL_STORAGE_KEY]: snippets });
  hasPendingSave = false;
  if (!localFallbackNotified) {
    setStatus('Salvo localmente (sync cheio)');
    localFallbackNotified = true;
  }
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
      <div class="handle" title="${translator.t('dragToReorderTooltip')}" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" opacity="0.6">
          <circle cx="7" cy="7" r="1.5"/><circle cx="7" cy="12" r="1.5"/><circle cx="7" cy="17" r="1.5"/>
          <circle cx="12" cy="7" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="17" r="1.5"/>
        </svg>
      </div>
      <div class="content">
        <div class="title">${escapeHtml(s.name)}</div>
        <div class="meta">${new Date(s.updatedAt).toLocaleString()}</div>
      </div>
      <button class="icon-btn del-btn" title="${translator.t('deleteTooltip')}" aria-label="${translator.t('deleteTooltip')}" data-action="delete" data-id="${s.id}">
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
        setStatus(translator.t('clearSearchToReorder'));
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
  
  // Ensure scroll works when loading saved code
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      void codeEl.offsetHeight; // Force reflow
      codeEl.style.overflowY = 'scroll';
      syncHighlightScroll();
    });
  });
}

function getActive() { return snippets.find((x) => x.id === activeId) || null; }

function applyFormToActive(options = {}) {
  const { trimName = false, forceTimestamp = false } = options;
  const s = getActive();
  if (!s) return { changed: false, snippet: null };
  const nameValue = trimName ? nameEl.value.trim() : nameEl.value;
  const nextName = nameValue || translator.t('noTitleFallback');
  const nextCode = codeEl.value;
  const changed = forceTimestamp || s.name !== nextName || s.code !== nextCode;
  if (changed) {
    s.name = nextName;
    s.code = nextCode;
    s.updatedAt = now();
  }
  return { changed, snippet: s };
}

function scheduleAutosave() {
  const { changed, snippet } = applyFormToActive();
  if (!snippet) return;
  if (changed) renderList();
  hasPendingSave = hasPendingSave || changed;
  if (!hasPendingSave) return;
  if (autosaveTimer !== null) clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    autosaveTimer = null;
    if (!hasPendingSave) return;
    saveAll().catch((err) => {
      console.warn('Autosave failed', err);
      hasPendingSave = true;
    });
  }, AUTOSAVE_MS);
}

async function flushAutosave() {
  if (autosaveTimer !== null) {
    clearTimeout(autosaveTimer);
    autosaveTimer = null;
  }
  const { snippet } = applyFormToActive({ trimName: true });
  if (!snippet || !hasPendingSave) return;
  try {
    await saveAll();
    renderList();
  } catch (err) {
    console.warn('Autosave flush failed', err);
    hasPendingSave = true;
  }
}

async function addSnippet() {
  const s = /** @type {Snippet} */ ({ id: uid(), name: translator.t('newSnippetName'), code: '', updatedAt: now() });
  snippets.unshift(s);
  await saveAll();
  selectSnippet(s.id);
  renderList();
}

async function saveSnippet() {
  const { snippet } = applyFormToActive({ trimName: true, forceTimestamp: true });
  if (!snippet) return;
  hasPendingSave = true;
  await saveAll();
  setStatus(translator.t('snippetSaved'));
  renderList();
}

function toggleFullscreen() {
  const url = chrome.runtime.getURL('popup.html?fullscreen=1');
  chrome.tabs.create({ url });
}

function updateFullscreenButton() {
  if (!fullscreenBtn) return;
  const label = translator.t('fullscreenEnter');
  fullscreenBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M9 3H5a2 2 0 0 0-2 2v4m0 6v4a2 2 0 0 0 2 2h4m6 0h4a2 2 0 0 0 2-2v-4m0-6V5a2 2 0 0 0-2-2h-4"/>
    </svg>
    ${label}
  `;
  fullscreenBtn.title = translator.t('fullscreenTooltip');
}

async function duplicateSnippet() {
  const s = getActive();
  if (!s) return;
  const copy = /** @type {Snippet} */ ({
    id: uid(),
    name: s.name + translator.t('copySuffix'),
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
  if (!confirm(translator.t('deleteConfirmation', { name: s.name }))) return;
  snippets = snippets.filter((x) => x.id !== s.id);
  await saveAll();
  activeId = snippets[0]?.id || null;
  if (activeId) selectSnippet(activeId); else { nameEl.value = ''; codeEl.value = ''; }
  renderList();
}

async function deleteSnippetById(id) {
  const s = snippets.find((x) => x.id === id);
  if (!s) return;
  if (!confirm(translator.t('deleteConfirmation', { name: s.name }))) return;
  const wasActive = activeId === id;
  snippets = snippets.filter((x) => x.id !== id);
  await saveAll();
  if (wasActive) {
    activeId = snippets[0]?.id || null;
    if (activeId) selectSnippet(activeId); else { nameEl.value = ''; codeEl.value = ''; updateHighlight(); }
  }
  renderList();
  setStatus(translator.t('snippetDeleted'));
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
      setStatus(translator.t('noActiveTab'));
      return;
    }

    // Check if we can execute scripts on this tab
    if (tab.url?.startsWith('chrome://') || tab.url?.startsWith('chrome-extension://') || tab.url?.startsWith('edge://') || tab.url?.startsWith('about:')) {
      setStatus(translator.t('cannotExecuteOnSpecialPages'));
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
      setStatus(translator.t('executedSuccessfully'));
    } else {
      setStatus(translator.t('errorExecuting') + ': ' + (result?.error || translator.t('unknownError')));
    }
  } catch (error) {
    console.error('Console Rules error:', error);
    setStatus(translator.t('errorExecuting') + ': ' + error.message);
  }
}

function bindEvents() {
  searchEl.addEventListener('input', renderList);
  newBtn.addEventListener('click', addSnippet);
  runBtn.addEventListener('click', runSnippet);
  saveBtn.addEventListener('click', saveSnippet);
  dupBtn.addEventListener('click', duplicateSnippet);
  delBtn.addEventListener('click', deleteSnippet);
  fullscreenBtn.addEventListener('click', toggleFullscreen);
  exportBtn.addEventListener('click', exportSnippets);
  importBtn.addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', handleImportFile);
  
  // Language selector
  languageSelector.addEventListener('change', async (e) => {
    await translator.setLanguage(e.target.value);
    updateUI();
  });

  // Editor events: input, scroll sync, Tab/Enter helpers
  codeEl.addEventListener('input', () => {
    updateHighlight();
    scheduleAutosave();
  });
  codeEl.addEventListener('scroll', syncHighlightScroll);
  // Fix scroll issue when pasting large code
  codeEl.addEventListener('paste', () => {
    // Allow default paste behavior, then fix scroll
    setTimeout(() => {
      // Force multiple reflows to ensure scrollHeight is calculated
      void codeEl.offsetHeight;
      updateHighlight();
      
      // Wait for highlight to update, then ensure scroll works
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Force another reflow
          void codeEl.offsetHeight;
          
          // Ensure scrollbar is visible
          codeEl.style.overflowY = 'scroll';
          
          // Try to scroll to verify it works
          const maxScroll = codeEl.scrollHeight - codeEl.clientHeight;
          if (maxScroll > 0) {
            // Test if we can scroll
            codeEl.scrollTop = maxScroll;
            syncHighlightScroll();
          }
        });
      });
    }, 0);
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
  nameEl.addEventListener('input', scheduleAutosave);

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
    setStatus(translator.t('orderUpdated'));
    renderList();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushAutosave();
  });
  window.addEventListener('beforeunload', () => {
    flushAutosave();
  });

  chrome.storage.onChanged.addListener(handleStorageChange);
}

function updateUI() {
  // Update all UI text elements
  newBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 5v14M5 12h14"/>
    </svg>
    ${translator.t('new')}
  `;
  newBtn.title = translator.t('newSnippetTooltip');
  
  runBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polygon points="5,3 19,12 5,21"/>
    </svg>
    ${translator.t('run')}
  `;
  runBtn.title = translator.t('runSnippetTooltip');
  
  saveBtn.textContent = translator.t('save');
  dupBtn.textContent = translator.t('duplicate');
  delBtn.textContent = translator.t('delete');
  updateFullscreenButton();
  exportBtn.textContent = translator.t('export');
  exportBtn.title = translator.t('exportTooltip');
  importBtn.textContent = translator.t('import');
  importBtn.title = translator.t('importTooltip');
  
  // Update form labels and placeholders
  document.querySelector('label[for="nameInput"]').textContent = translator.t('nameLabel');
  document.querySelector('label[for="codeInput"]').textContent = translator.t('codeLabel');
  nameEl.placeholder = translator.t('namePlaceholder');
  codeEl.placeholder = translator.t('codePlaceholder');
  searchEl.placeholder = translator.t('searchPlaceholder');
  
  // Update aria labels
  listEl.setAttribute('aria-label', translator.t('savedSnippetsAria'));
  
  // Re-render the list to update tooltips and other dynamic content
  renderList();
}

(async function init() {
  await translator.init();
  languageSelector.value = translator.getCurrentLanguage();
  if (isFullscreenPage) {
    document.body.classList.add('fullscreen');
    isFullscreen = true;
  }
  
  await loadSnippets();
  activeId = snippets[0]?.id || null;
  bindEvents();
  updateUI();
  if (activeId) selectSnippet(activeId);
  if (isFullscreenPage && fullscreenBtn) fullscreenBtn.style.display = 'none';
})();

// ----- Syntax highlighting (lightweight) -----
function syncHighlightScroll() {
  if (!highlightPre) return;
  highlightPre.scrollTop = codeEl.scrollTop;
  highlightPre.scrollLeft = codeEl.scrollLeft;
}

// Ensure textarea can scroll to the absolute end
function ensureScrollable() {
  // Simple approach: just ensure scroll works by forcing a reflow
  void codeEl.offsetHeight;
  const scrollHeight = codeEl.scrollHeight;
  const clientHeight = codeEl.clientHeight;
  
  if (scrollHeight > clientHeight) {
    // Ensure the scrollbar is visible and functional
    codeEl.style.overflowY = 'scroll';
    syncHighlightScroll();
  }
}

function handleStorageChange(changes, areaName) {
  if (areaName !== 'sync' && areaName !== 'local') return;
  const syncChange = changes[STORAGE_KEY];
  const localChange = changes[LOCAL_STORAGE_KEY];
  const next = syncChange?.newValue || localChange?.newValue;
  if (!Array.isArray(next)) return;
  snippets = next;
  const keepId = snippets.find((s) => s.id === activeId) ? activeId : snippets[0]?.id || null;
  activeId = keepId;
  renderList();
  if (keepId) selectSnippet(keepId);
}

function updateHighlight() {
  const code = codeEl.value;
  if (!highlightCode) return;
  highlightCode.innerHTML = highlightJS(code);
  if (code.endsWith('\n')) highlightCode.innerHTML += ' ';
  syncHighlightScroll();
  
  // Ensure scroll works after highlight update (for saved code)
  requestAnimationFrame(() => {
    void codeEl.offsetHeight; // Force reflow
    const scrollHeight = codeEl.scrollHeight;
    const clientHeight = codeEl.clientHeight;
    if (scrollHeight > clientHeight) {
      codeEl.style.overflowY = 'scroll';
    }
  });
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
  scheduleAutosave();
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
  setStatus(translator.t('exported'));
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
    if (!Array.isArray(imported)) throw new Error(translator.t('importFailed'));
    const cleaned = [];
    for (const item of imported) {
      if (!item || typeof item.code !== 'string') continue;
      const name = (item.name && String(item.name)) || translator.t('noTitleFallback');
      const code = String(item.code);
      const updatedAt = Number(item.updatedAt) || now();
      cleaned.push({ id: uid(), name, code, updatedAt });
    }
    if (cleaned.length === 0) throw new Error(translator.t('nothingToImport'));

    // Merge: prepend imported, keep existing
    snippets = [...cleaned, ...snippets];
    await saveAll();
    activeId = cleaned[0].id;
    selectSnippet(activeId);
    renderList();
    setStatus(translator.t('importedCount', { count: cleaned.length }));
  } catch (err) {
    console.warn('Falha ao importar', err);
    alert(translator.t('importFailed') + ': ' + (err && err.message ? err.message : String(err)));
  }
}
