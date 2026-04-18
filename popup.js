// ─── SiteNotes · popup.js ──────────────────────────────────────────────────

const STORAGE_KEY = 'sitenotes_data';

let currentDomain = null;
let allNotes = {};

// ── DOM refs ──────────────────────────────────────────────────────────────────

const $ = (id) => document.getElementById(id);

const editorView    = $('editorView');
const allNotesView  = $('allNotesView');
const noteTextarea  = $('noteTextarea');
const tagsInput     = $('tagsInput');
const saveBtn       = $('saveBtn');
const deleteBtn     = $('deleteBtn');
const quickEditBtn  = $('quickEditBtn');
const viewAllBtn    = $('viewAllBtn');
const backBtn       = $('backBtn');
const statusDot     = $('statusDot');
const statusText    = $('statusText');
const currentDomainEl = $('currentDomain');
const savedToast    = $('savedToast');
const notesList     = $('notesList');
const notesCount    = $('notesCount');
const emptyState    = $('emptyState');
const searchInput   = $('searchInput');

// ── Init ──────────────────────────────────────────────────────────────────────

async function init() {
  // Get current tab domain
  const response = await sendToBackground({ type: 'GET_CURRENT_DOMAIN' });
  currentDomain = response?.domain || null;

  if (currentDomain) {
    currentDomainEl.textContent = currentDomain;
  }

  // Load all notes
  allNotes = await loadAllNotes();

  // Populate editor for current domain
  if (currentDomain) {
    const note = allNotes[currentDomain];
    if (note) {
      noteTextarea.value = note.text || '';
      tagsInput.value = (note.tags || []).join(', ');
      setStatus(true, `Note saved for ${currentDomain}`);
      deleteBtn.style.display = 'flex';
    } else {
      setStatus(false, 'No note for this site');
      deleteBtn.style.display = 'none';
    }
  } else {
    setStatus(false, 'Not a web page');
    noteTextarea.disabled = true;
    tagsInput.disabled = true;
    saveBtn.disabled = true;
    noteTextarea.placeholder = 'Open a website to add a note…';
  }
}

// ── Storage ───────────────────────────────────────────────────────────────────

function loadAllNotes() {
  return new Promise((resolve) => {
    chrome.storage.sync.get([STORAGE_KEY], (result) => {
      resolve(result[STORAGE_KEY] || {});
    });
  });
}

function saveAllNotes(notes) {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ [STORAGE_KEY]: notes }, resolve);
  });
}

// ── Status bar ────────────────────────────────────────────────────────────────

function setStatus(hasNote, text) {
  statusText.textContent = text;
  if (hasNote) {
    statusDot.classList.add('active');
  } else {
    statusDot.classList.remove('active');
  }
}

// ── Save ──────────────────────────────────────────────────────────────────────

saveBtn.addEventListener('click', async () => {
  if (!currentDomain) return;

  const text = noteTextarea.value.trim();
  const rawTags = tagsInput.value;
  const tags = rawTags.split(',').map(t => t.trim()).filter(Boolean);

  if (!text) {
    // Treat empty save as delete
    await deleteCurrentNote();
    return;
  }

  const existing = allNotes[currentDomain] || {};
  allNotes[currentDomain] = {
    text,
    tags,
    updatedAt: Date.now(),
    createdAt: existing.createdAt || Date.now()
  };

  await saveAllNotes(allNotes);
  sendToBackground({ type: 'NOTE_UPDATED' });

  setStatus(true, `Note saved for ${currentDomain}`);
  deleteBtn.style.display = 'flex';
  showSavedToast();
});

// ── Delete ────────────────────────────────────────────────────────────────────

deleteBtn.addEventListener('click', deleteCurrentNote);

async function deleteCurrentNote() {
  if (!currentDomain) return;
  delete allNotes[currentDomain];
  await saveAllNotes(allNotes);
  sendToBackground({ type: 'NOTE_UPDATED' });

  noteTextarea.value = '';
  tagsInput.value = '';
  setStatus(false, 'No note for this site');
  deleteBtn.style.display = 'none';
  showSavedToast('✓ Deleted');
}

// ── Quick on-page editor ──────────────────────────────────────────────────────

quickEditBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    chrome.tabs.sendMessage(tab.id, { type: 'OPEN_QUICK_EDITOR' }).catch(() => {});
    window.close();
  }
});

// ── Saved toast ───────────────────────────────────────────────────────────────

function showSavedToast(msg = '✓ Saved') {
  savedToast.textContent = msg;
  savedToast.classList.add('visible');
  setTimeout(() => savedToast.classList.remove('visible'), 2000);
}

// ── View toggle ───────────────────────────────────────────────────────────────

viewAllBtn.addEventListener('click', () => {
  editorView.style.display = 'none';
  allNotesView.style.display = 'flex';
  renderNotesList();
});

backBtn.addEventListener('click', () => {
  allNotesView.style.display = 'none';
  editorView.style.display = 'flex';
});

// ── Notes list renderer ───────────────────────────────────────────────────────

function renderNotesList(filter = '') {
  const entries = Object.entries(allNotes);
  const filtered = filter
    ? entries.filter(([domain, note]) =>
        domain.includes(filter) ||
        (note.text || '').toLowerCase().includes(filter.toLowerCase()) ||
        (note.tags || []).some(t => t.toLowerCase().includes(filter.toLowerCase()))
      )
    : entries;

  // Sort by most recently updated
  filtered.sort((a, b) => (b[1].updatedAt || 0) - (a[1].updatedAt || 0));

  notesCount.textContent = filtered.length;
  notesList.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.style.display = 'flex';
    return;
  }

  emptyState.style.display = 'none';

  filtered.forEach(([domain, note], idx) => {
    const item = document.createElement('div');
    item.className = 'note-item' + (domain === currentDomain ? ' active-site' : '');
    item.style.animationDelay = `${idx * 30}ms`;

    const tagsHtml = (note.tags && note.tags.length)
      ? `<div class="note-item-tags">${note.tags.map(t => `<span class="note-item-tag">${escapeHtml(t)}</span>`).join('')}</div>`
      : '';

    const date = note.updatedAt ? formatDate(note.updatedAt) : '';

    item.innerHTML = `
      <div class="note-item-header">
        <span class="note-item-domain">${escapeHtml(domain)}</span>
        <span class="note-item-date">${date}</span>
      </div>
      <div class="note-item-preview">${escapeHtml(note.text || '')}</div>
      ${tagsHtml}
      <div class="note-item-delete" data-domain="${escapeHtml(domain)}" title="Delete">✕</div>
    `;

    // Click to edit
    item.addEventListener('click', (e) => {
      if (e.target.classList.contains('note-item-delete')) return;

      // If it's the current domain, go back to editor
      if (domain === currentDomain) {
        allNotesView.style.display = 'none';
        editorView.style.display = 'flex';
        return;
      }

      // Otherwise open that domain in a new tab
      chrome.tabs.create({ url: `https://${domain}` });
    });

    // Delete button
    item.querySelector('.note-item-delete').addEventListener('click', async (e) => {
      e.stopPropagation();
      delete allNotes[domain];
      await saveAllNotes(allNotes);
      sendToBackground({ type: 'NOTE_UPDATED' });

      // Refresh current domain's editor if needed
      if (domain === currentDomain) {
        noteTextarea.value = '';
        tagsInput.value = '';
        setStatus(false, 'No note for this site');
        deleteBtn.style.display = 'none';
      }

      renderNotesList(searchInput.value);
    });

    notesList.appendChild(item);
  });
}

// ── Search ────────────────────────────────────────────────────────────────────

searchInput.addEventListener('input', () => {
  renderNotesList(searchInput.value.trim());
});

// ── Keyboard shortcut: Cmd/Ctrl+Enter to save ─────────────────────────────────

noteTextarea.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    e.preventDefault();
    saveBtn.click();
  }
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function sendToBackground(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      resolve(response);
    });
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(ts) {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Boot ──────────────────────────────────────────────────────────────────────

init();
