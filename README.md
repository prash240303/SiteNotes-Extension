# SiteNotes — Chrome Extension

> Attach persistent notes to any website. Get reminded every time you revisit.

---

## Installation

### Step 1 — Load the Extension

1. Open Chrome and navigate to `chrome://extensions`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **"Load unpacked"**
4. Select the `context-notes-extension` folder
5. The SiteNotes extension will appear in your toolbar

> Tip: Pin the extension by clicking the puzzle icon in Chrome's toolbar and pinning SiteNotes.

---

## How to Use

<div align="center">
  <img
    src="https://github.com/user-attachments/assets/d05da035-314a-4fca-b24c-ee5649c5e815"
    alt="SiteNotes — full page view"
    width="780"
    style="border-radius: 12px; border: 1px solid #2a2a3e; box-shadow: 0 8px 32px rgba(0,0,0,0.4);"
  />
</div>

<br>

<div align="center">
  <img
    src="https://github.com/user-attachments/assets/4a1ba2cb-57d1-4fed-b26b-bd959de0a72b"
    alt="SiteNotes — popup UI"
    width="420"
    style="border-radius: 12px; border: 1px solid #2a2a3e; box-shadow: 0 8px 32px rgba(0,0,0,0.4);"
  />
</div>

<br>

### Adding a Note
1. Visit any website (e.g. `overleaf.com`)
2. Click the SiteNotes icon in the toolbar
3. Type your note in the editor
4. Optionally add tags (comma-separated)
5. Click **Save** or press `Cmd/Ctrl + Enter`

### Getting Notified
- When you revisit a site with a saved note, a **toast notification** slides up from the bottom-right corner of the page
- The extension icon shows an **amber badge dot (●)** when a note exists for the current site

### Editing / Deleting
- Click the extension icon to edit or delete the note for the current site
- Click the **list icon** (top-right of popup) to see all saved notes

### On-page Quick Editor
- Click **"On-page"** in the popup, or use the keyboard shortcut `Ctrl+Shift+N` (Mac: `Cmd+Shift+N`) to open an inline editor directly on the page

### All Notes View
- Click the list icon in the popup header to browse all saved notes
- Use the search bar to filter by domain, note content, or tags
- Click any note to visit that site
- Delete individual notes with the ✕ button

---

## Features

| Feature | Details |
|---|---|
| Per-domain notes | Notes tied to `overleaf.com`, not specific pages |
| Persistent storage | Uses `chrome.storage.sync` — survives browser restarts |
| Cross-device sync | Syncs via your Google account (if Chrome sync is on) |
| Toast notifications | Non-intrusive slide-up on page load |
| Badge indicator | Amber ● dot on extension icon |
| Tags | Categorize notes with comma-separated tags |
| Quick editor | On-page overlay editor via keyboard shortcut |
| Search | Filter all notes by domain, content, or tag |
| Dark mode | Dark-first design works great on any site |

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+N` / `Cmd+Shift+N` | Open quick editor on current page |
| `Ctrl+Enter` / `Cmd+Enter` | Save note (inside popup) |

---

## Technical Details

- **Manifest V3** compliant
- **Service worker** (`background.js`) handles badge updates and event detection
- **Content script** (`content.js`) injects toast and quick editor UI
- **Popup** (`popup.html/css/js`) manages the main note editor and all-notes view
- Notes stored at domain level: `www.overleaf.com` and `overleaf.com` both map to `overleaf.com`

---

## Privacy

All notes are stored locally in your browser via `chrome.storage.sync`. If Chrome sync is enabled, notes sync to your Google account — no third-party servers involved.
