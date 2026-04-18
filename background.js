// ─── SiteNotes · background.js ─────────────────────────────────────────────
// Service worker: handles tab events, badge updates, notifications

const STORAGE_KEY = 'sitenotes_data';

// ── Helpers ──────────────────────────────────────────────────────────────────

function extractDomain(url) {
  try {
    const u = new URL(url);
    // Strip www. for consistent matching
    return u.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

async function getAllNotes() {
  return new Promise((resolve) => {
    chrome.storage.sync.get([STORAGE_KEY], (result) => {
      resolve(result[STORAGE_KEY] || {});
    });
  });
}

async function getNoteForDomain(domain) {
  const notes = await getAllNotes();
  return notes[domain] || null;
}

// ── Badge management ──────────────────────────────────────────────────────────

async function updateBadge(tabId, url) {
  const domain = extractDomain(url);
  if (!domain) {
    chrome.action.setBadgeText({ text: '', tabId });
    return;
  }

  const note = await getNoteForDomain(domain);
  if (note) {
    chrome.action.setBadgeText({ text: '●', tabId });
    chrome.action.setBadgeBackgroundColor({ color: '#F5A623', tabId });
    chrome.action.setBadgeTextColor({ color: '#1A1A2E', tabId });
    chrome.action.setTitle({ title: `SiteNotes — Note saved for ${domain}`, tabId });
  } else {
    chrome.action.setBadgeText({ text: '', tabId });
    chrome.action.setTitle({ title: 'SiteNotes — Click to add a note', tabId });
  }
}

// ── Toast notification via content script ────────────────────────────────────

async function notifyContentScript(tabId, note, domain) {
  try {
    await chrome.tabs.sendMessage(tabId, {
      type: 'SHOW_NOTE_TOAST',
      note: note,
      domain: domain
    });
  } catch {
    // Content script may not be ready yet — ignore
  }
}

// ── Tab event listeners ───────────────────────────────────────────────────────

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') return;
  if (!tab.url || tab.url.startsWith('chrome://')) return;

  const domain = extractDomain(tab.url);
  if (!domain) return;

  await updateBadge(tabId, tab.url);

  const note = await getNoteForDomain(domain);
  if (note && note.text && note.text.trim()) {
    // Small delay to let page settle before showing toast
    setTimeout(() => notifyContentScript(tabId, note, domain), 800);
  }
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId);
  if (!tab.url || tab.url.startsWith('chrome://')) return;
  await updateBadge(tabId, tab.url);
});

// ── Keyboard shortcut handler ─────────────────────────────────────────────────

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'quick-add-note') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      // Open popup programmatically isn't directly possible in MV3,
      // so we send a message to content script to show inline editor
      chrome.tabs.sendMessage(tab.id, { type: 'OPEN_QUICK_EDITOR' }).catch(() => {});
    }
  }
});

// ── Message handler from popup / content script ───────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'NOTE_UPDATED') {
    // Refresh badge for the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, async ([tab]) => {
      if (tab) await updateBadge(tab.id, tab.url);
    });
    sendResponse({ ok: true });
  }
  if (message.type === 'GET_CURRENT_DOMAIN') {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      sendResponse({ domain: tab ? extractDomain(tab.url) : null, url: tab?.url });
    });
    return true; // async
  }
  return true;
});
