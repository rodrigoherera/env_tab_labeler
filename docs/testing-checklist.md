# Manual Testing Checklist

## Core Overlay
- Load the unpacked extension in Chrome and ensure the popup shows the active rule for `https://localhost` using the default presets.
- Verify ribbon, banner, and border modes render as expected when mode is overridden per rule and when inheriting the global default.
- Toggle visibility with `Ctrl+Shift+E` (or `⌘+Shift+E` on macOS) and confirm the badge clears and reappears.

## Matching & Scope
- Create rules for hostname, URL, regex, and scope-only (host/path/port) cases; navigate between matching and non-matching URLs to ensure the overlay updates without reload.
- Confirm regex rules validate and skip gracefully when malformed by attempting to save an invalid pattern.

## Options UI
- Add, edit, import, export, and delete rules; ensure quick presets apply expected colors and overrides.
- Change global defaults (mode, size, badge, opacity) and confirm they propagate to content scripts after saving.
- Import the exported JSON and verify per-rule overrides (mode, badge, scope) persist.

## Popup
- Open the popup on tabs with/without matching rules and when the extension is disabled to confirm status messaging.
- Toggle visibility via the popup button and confirm state syncs with keyboard shortcuts.

## Packaging
- Run `npm run build` and load the generated `env-tab-labeler.zip` to confirm all assets (icons, popup, options) are included.
