// ─── SiteNotes · content.js ────────────────────────────────────────────────
// Injects toast notifications and quick editor overlay into pages

const STORAGE_KEY = 'sitenotes_data';
const TOAST_SHOWN_KEY = '__sitenotes_toast_shown__';

// ── Prevent duplicate toasts per page load ────────────────────────────────────
let toastShownThisLoad = false;

// ── Styles injected once ──────────────────────────────────────────────────────

function injectStyles() {
  if (document.getElementById('sitenotes-styles')) return;
  const style = document.createElement('style');
  style.id = 'sitenotes-styles';
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&family=DM+Sans:wght@400;500;600&display=swap');

    #sitenotes-toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 2147483647;
      max-width: 360px;
      min-width: 280px;
      background: #0F0F1A;
      border: 1px solid rgba(245, 166, 35, 0.3);
      border-radius: 12px;
      padding: 0;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(245,166,35,0.08);
      font-family: 'DM Sans', sans-serif;
      transform: translateY(100px);
      opacity: 0;
      transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease;
      pointer-events: all;
    }
    #sitenotes-toast.visible {
      transform: translateY(0);
      opacity: 1;
    }
    #sitenotes-toast .sn-toast-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 14px 8px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    #sitenotes-toast .sn-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #F5A623;
      flex-shrink: 0;
      box-shadow: 0 0 8px rgba(245,166,35,0.6);
    }
    #sitenotes-toast .sn-label {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #F5A623;
      flex: 1;
    }
    #sitenotes-toast .sn-domain {
      font-size: 10px;
      color: rgba(255,255,255,0.35);
      font-family: 'DM Mono', monospace;
    }
    #sitenotes-toast .sn-close {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: rgba(255,255,255,0.3);
      font-size: 14px;
      border-radius: 4px;
      transition: color 0.2s, background 0.2s;
      line-height: 1;
    }
    #sitenotes-toast .sn-close:hover {
      color: rgba(255,255,255,0.8);
      background: rgba(255,255,255,0.08);
    }
    #sitenotes-toast .sn-toast-body {
      padding: 10px 14px 14px;
    }
    #sitenotes-toast .sn-note-text {
      font-size: 13px;
      line-height: 1.6;
      color: rgba(255,255,255,0.85);
      font-family: 'DM Mono', monospace;
      font-weight: 300;
      white-space: pre-wrap;
      word-break: break-word;
      max-height: 120px;
      overflow-y: auto;
    }
    #sitenotes-toast .sn-note-text::-webkit-scrollbar {
      width: 3px;
    }
    #sitenotes-toast .sn-note-text::-webkit-scrollbar-track {
      background: transparent;
    }
    #sitenotes-toast .sn-note-text::-webkit-scrollbar-thumb {
      background: rgba(245,166,35,0.3);
      border-radius: 2px;
    }
    #sitenotes-toast .sn-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 8px;
    }
    #sitenotes-toast .sn-tag {
      font-size: 10px;
      padding: 2px 7px;
      border-radius: 20px;
      background: rgba(245,166,35,0.12);
      color: rgba(245,166,35,0.8);
      font-family: 'DM Sans', sans-serif;
      font-weight: 500;
    }

    /* ── Quick Editor Overlay ──────────────────────────────────────── */
    #sitenotes-overlay {
      position: fixed;
      inset: 0;
      z-index: 2147483646;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.25s ease;
      pointer-events: none;
    }
    #sitenotes-overlay.visible {
      opacity: 1;
      pointer-events: all;
    }
    #sitenotes-editor {
      background: #0F0F1A;
      border: 1px solid rgba(245,166,35,0.2);
      border-radius: 16px;
      width: 480px;
      max-width: calc(100vw - 48px);
      padding: 24px;
      box-shadow: 0 24px 64px rgba(0,0,0,0.6);
      transform: scale(0.95);
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      font-family: 'DM Sans', sans-serif;
    }
    #sitenotes-overlay.visible #sitenotes-editor {
      transform: scale(1);
    }
    #sitenotes-editor .sne-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 16px;
    }
    #sitenotes-editor .sne-icon {
      width: 28px;
      height: 28px;
      background: rgba(245,166,35,0.15);
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
    }
    #sitenotes-editor .sne-title {
      flex: 1;
      font-size: 14px;
      font-weight: 600;
      color: #fff;
    }
    #sitenotes-editor .sne-domain {
      font-size: 11px;
      font-family: 'DM Mono', monospace;
      color: rgba(245,166,35,0.7);
    }
    #sitenotes-editor .sne-close {
      cursor: pointer;
      color: rgba(255,255,255,0.3);
      font-size: 18px;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      transition: all 0.2s;
    }
    #sitenotes-editor .sne-close:hover {
      background: rgba(255,255,255,0.08);
      color: rgba(255,255,255,0.8);
    }
    #sitenotes-editor textarea {
      width: 100%;
      box-sizing: border-box;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px;
      padding: 12px;
      color: rgba(255,255,255,0.9);
      font-family: 'DM Mono', monospace;
      font-size: 13px;
      font-weight: 300;
      line-height: 1.6;
      resize: vertical;
      min-height: 120px;
      outline: none;
      transition: border-color 0.2s;
    }
    #sitenotes-editor textarea:focus {
      border-color: rgba(245,166,35,0.4);
    }
    #sitenotes-editor textarea::placeholder {
      color: rgba(255,255,255,0.2);
    }
    #sitenotes-editor .sne-tags-input {
      margin-top: 10px;
    }
    #sitenotes-editor .sne-tags-label {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.3);
      margin-bottom: 6px;
    }
    #sitenotes-editor .sne-tags-field {
      width: 100%;
      box-sizing: border-box;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 6px;
      padding: 8px 10px;
      color: rgba(255,255,255,0.7);
      font-family: 'DM Sans', sans-serif;
      font-size: 12px;
      outline: none;
      transition: border-color 0.2s;
    }
    #sitenotes-editor .sne-tags-field:focus {
      border-color: rgba(245,166,35,0.3);
    }
    #sitenotes-editor .sne-tags-field::placeholder {
      color: rgba(255,255,255,0.18);
    }
    #sitenotes-editor .sne-actions {
      display: flex;
      gap: 8px;
      margin-top: 14px;
      justify-content: flex-end;
    }
    #sitenotes-editor .sne-btn {
      padding: 8px 18px;
      border-radius: 7px;
      font-size: 13px;
      font-family: 'DM Sans', sans-serif;
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }
    #sitenotes-editor .sne-btn-cancel {
      background: rgba(255,255,255,0.06);
      color: rgba(255,255,255,0.5);
    }
    #sitenotes-editor .sne-btn-cancel:hover {
      background: rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.8);
    }
    #sitenotes-editor .sne-btn-save {
      background: #F5A623;
      color: #0F0F1A;
    }
    #sitenotes-editor .sne-btn-save:hover {
      background: #FFB940;
      box-shadow: 0 4px 14px rgba(245,166,35,0.35);
    }
  `;
  document.head.appendChild(style);
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function showToast(note, domain) {
  if (toastShownThisLoad) return;
  toastShownThisLoad = true;

  injectStyles();
  removeToast();

  const toast = document.createElement('div');
  toast.id = 'sitenotes-toast';

  const tagsHtml = (note.tags && note.tags.length)
    ? `<div class="sn-tags">${note.tags.map(t => `<span class="sn-tag">${escapeHtml(t)}</span>`).join('')}</div>`
    : '';

  toast.innerHTML = `
    <div class="sn-toast-header">
      <div class="sn-dot"></div>
      <span class="sn-label">Site Note</span>
      <span class="sn-domain">${escapeHtml(domain)}</span>
      <div class="sn-close" id="sn-close-btn">✕</div>
    </div>
    <div class="sn-toast-body">
      <div class="sn-note-text">${escapeHtml(note.text)}</div>
      ${tagsHtml}
    </div>
  `;

  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('visible'));
  });

  toast.querySelector('#sn-close-btn').addEventListener('click', removeToast);

  // Auto-dismiss after 8 seconds
  setTimeout(removeToast, 8000);
}

function removeToast() {
  const toast = document.getElementById('sitenotes-toast');
  if (!toast) return;
  toast.classList.remove('visible');
  setTimeout(() => toast.remove(), 400);
}

// ── Quick Editor ──────────────────────────────────────────────────────────────

async function openQuickEditor(domain) {
  injectStyles();
  removeQuickEditor();

  // Get existing note
  const data = await new Promise(res =>
    chrome.storage.sync.get([STORAGE_KEY], r => res(r[STORAGE_KEY] || {}))
  );
  const existing = data[domain] || { text: '', tags: [] };

  const overlay = document.createElement('div');
  overlay.id = 'sitenotes-overlay';
  overlay.innerHTML = `
    <div id="sitenotes-editor">
      <div class="sne-header">
        <div class="sne-icon">📝</div>
        <div class="sne-title">Site Note</div>
        <div class="sne-domain">${escapeHtml(domain)}</div>
        <div class="sne-close" id="sne-close">✕</div>
      </div>
      <textarea id="sne-textarea" placeholder="Add a note for this site…">${escapeHtml(existing.text)}</textarea>
      <div class="sne-tags-input">
        <div class="sne-tags-label">Tags</div>
        <input class="sne-tags-field" id="sne-tags" placeholder="work, research, follow-up (comma separated)" value="${escapeHtml((existing.tags || []).join(', '))}">
      </div>
      <div class="sne-actions">
        <button class="sne-btn sne-btn-cancel" id="sne-cancel">Cancel</button>
        <button class="sne-btn sne-btn-save" id="sne-save">Save Note</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => overlay.classList.add('visible'));
  });

  overlay.querySelector('#sne-close').addEventListener('click', removeQuickEditor);
  overlay.querySelector('#sne-cancel').addEventListener('click', removeQuickEditor);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) removeQuickEditor(); });

  const textarea = overlay.querySelector('#sne-textarea');
  textarea.focus();
  textarea.setSelectionRange(textarea.value.length, textarea.value.length);

  overlay.querySelector('#sne-save').addEventListener('click', async () => {
    const text = textarea.value.trim();
    const rawTags = overlay.querySelector('#sne-tags').value;
    const tags = rawTags.split(',').map(t => t.trim()).filter(Boolean);

    const fresh = await new Promise(res =>
      chrome.storage.sync.get([STORAGE_KEY], r => res(r[STORAGE_KEY] || {}))
    );

    if (text) {
      fresh[domain] = {
        text,
        tags,
        updatedAt: Date.now(),
        createdAt: fresh[domain]?.createdAt || Date.now()
      };
    } else {
      delete fresh[domain];
    }

    chrome.storage.sync.set({ [STORAGE_KEY]: fresh }, () => {
      chrome.runtime.sendMessage({ type: 'NOTE_UPDATED' });
      removeQuickEditor();
      toastShownThisLoad = false; // allow re-show
    });
  });
}

function removeQuickEditor() {
  const overlay = document.getElementById('sitenotes-overlay');
  if (!overlay) return;
  overlay.classList.remove('visible');
  setTimeout(() => overlay.remove(), 250);
}

// ── Utils ─────────────────────────────────────────────────────────────────────

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ── Message listener ──────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'SHOW_NOTE_TOAST') {
    showToast(message.note, message.domain);
  }
  if (message.type === 'OPEN_QUICK_EDITOR') {
    const domain = window.location.hostname.replace(/^www\./, '');
    openQuickEditor(domain);
  }
});
