# Changelog

## [2.0.0] - 2026-08-13

### Added
- Quick, Standard, Deep and Custom cleanup presets.
- Current-site cleanup using origin-scoped browsing data removal.
- Developer/Troubleshooting mode with hard reload.
- IndexedDB, Service Worker, Local/site storage and File System cleanup options.
- Cleanup preview.
- Local cleanup timestamp and freshness indicator.
- Optional startup cache cleanup.
- Keyboard shortcut support.

### Safety
- Password deletion is never requested.
- Cookies remain opt-in and are scoped to the current site when selected.
- Startup cleanup only removes cache and Cache Storage.
- No network requests or telemetry.
