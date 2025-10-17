# Repository Guidelines

## Project Structure & Module Organization
- `manifest.json` defines the MV3 service worker entry point and extension permissions; update version numbers here when shipping.
- `background.js` holds service worker logic for hotkeys and state syncing.
- `content.js` injects the environment ribbon, banner, or border into active pages and now exposes state for the popup; keep DOM helpers and styling together here.
- `options.html`, `options.js`, and `options.css` render the rules editor UI with per-rule overrides; extend these files together when adding new configuration fields.
- `popup.html`, `popup.js`, and `popup.css` power the toolbar popup; update them alongside the content script when state or messaging changes.
- All source lives at the repo root; add new assets in place (fonts/icons under `icons/`) and update the manifest accordingly.

## Build, Test, and Development Commands
- `npm run build` packages `env-tab-labeler.zip` with manifest, scripts, styles, popup, and icons, overwriting the prior archive.
- `open -a "Google Chrome" chrome://extensions/` (macOS) or `google-chrome --new-window chrome://extensions/` (Linux) opens the extensions page for loading the unpacked build during local development.
- Use the **Reload** button in `chrome://extensions` after code changes; no additional build step is required.

## Coding Style & Naming Conventions
- JavaScript uses two-space indentation, semicolons, and `const`/`let` for clarity; match the existing pattern in each file.
- Prefer descriptive camelCase identifiers (e.g., `applyRule`, `toggleOverlay`) and inline helper functions over global state.
- Keep file names lowercase with hyphens or dots (e.g., `options-panel.js`) and update import references in the manifest when renaming.
- Run `npm run format` (or `npm run lint` for validation) before sending a PR if the change is sizable; a `package.json` script proxies to Prettier.

## Testing Guidelines
- There is no automated test suite; follow the scenarios in `docs/testing-checklist.md` (overlay modes, matching paths/ports, popup flows) before submitting changes.
- Capture console output from both the background service worker and active tab (`chrome://extensions` → Inspect views) to confirm storage events and messaging.
- When adding options, confirm sync storage writes succeed and the UI persists across reloads.

## Commit & Pull Request Guidelines
- Existing history uses short, lower-case summaries; follow a concise imperative style such as `add banner opacity control`.
- Reference related issues in the description and call out UI-affecting changes with before/after screenshots or short GIFs.
- List manual test scenarios completed (e.g., “Reloaded in Chrome 122, verified ribbon + border modes”) so reviewers can reproduce them.
