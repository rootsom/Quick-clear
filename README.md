# Quick Clear v2.0.0

A local-first Chrome/Chromium extension for safe, transparent browser cleanup.

## Features
- Quick, Standard, Deep and Custom cleanup presets
- Browser-wide Cache, Cache Storage and History cleanup
- Deep cleanup can also target IndexedDB, Service Workers, Local/site storage and File systems
- Current-site cleanup by origin
- Developer/Troubleshooting mode with clear + hard reload
- Optional current-site cookie clearing (off by default)
- Cleanup preview and explicit data-type selection
- Local cleanup timestamp and cleanup-freshness indicator
- Optional cache + Cache Storage cleanup on browser startup
- Keyboard shortcut: Ctrl+Shift+Y (Command+Shift+Y on macOS)
- Passwords are never selected or removed
- No external requests, analytics or telemetry

## Privacy
Quick Clear uses Chromium's `browsingData` API locally. It does not send browsing history, URLs, cookies, cache contents or other browser data to a server.

## Install
1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the `quick-clear` folder.

## Release
The repository root is the extension source. Releases should be tagged from the version in `manifest.json`.
