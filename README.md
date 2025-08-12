# Env Tab Labeler (Chrome MV3 Extension)

A tiny extension to visually label your tabs (LOCAL / DEV / STAGING / PROD, or anything you want).

## Features
- Ribbon (corner), Banner (top), or Border (around page)
- Custom text and colors per rule
- Match by substring (hostname/URL) or regex (`/regex/`)
- Badge text on the extension icon per-tab (optional)
- Toggle on the current tab with `Ctrl+Shift+E` (`Cmd+Shift+E` on macOS)
- Syncs across Chrome via `chrome.storage.sync`
- No page-breaking: overlay uses `pointer-events: none` and a Shadow DOM

## Install (Developer mode)
1. Download the `env-tab-labeler.zip` from the link I gave you in chat.
2. Unzip it.
3. Open **chrome://extensions**, enable **Developer mode**.
4. Click **Load unpacked**, select the unzipped folder.
5. Open the **Options** page to add/edit your rules.

## Tips
- **Pattern** examples:
  - `localhost` — matches http://localhost:3000 and similar.
  - `.dev.` — matches domains containing `.dev.` anywhere in the hostname or URL.
  - `/^https?:\/\/staging\.example\.com/` — a regex (note the starting/ending slashes).
- Use different **positions** for multiple environments (e.g., DEV top-left, STG bottom-left).
- If something looks off on a page, press the hotkey `Ctrl+Shift+E` to hide/show quickly.