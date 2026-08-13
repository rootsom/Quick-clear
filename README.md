# Quick Clear — Cache & History

![License](https://img.shields.io/badge/license-MIT-3ED6B5)
![Manifest V3](https://img.shields.io/badge/manifest-v3-171D26)

A one-click browser extension that clears **cache and browsing history
only**. Passwords and site permission settings are never touched. Works in
**Brave**, Chrome, Edge, and any other Chromium-based browser — they all
load extensions the same way.

<p>
  <img src="logo.png" alt="Quick Clear logo" width="480" />
</p>

## Download

**[⬇ Download the latest release](../../releases/latest)** — grab
`quick-clear-extension.zip` from the Releases page, unzip it, and follow the
install steps below. No build tools or command line needed.

(Prefer to use the source directly? Clone or download this repo as a zip
from the green **Code** button above — the repo root *is* the extension.)

## Install on Brave

1. Unzip the downloaded file somewhere permanent — don't delete it after
   installing, Brave loads the extension directly from these files (there's
   no separate build step).
2. Open a new tab and go to `brave://extensions`.
3. Turn on **Developer mode** (top right toggle).
4. Click **Load unpacked** and select the unzipped `quick-clear` folder.
5. Click the puzzle-piece icon in the toolbar and pin **Quick Clear** so it's
   always visible.

Brave Shields doesn't interfere with this — `browsingData` is a standard
browser API, not a network request Shields would block.

## Install on Chrome / Edge

Same steps, just swap the URL: `chrome://extensions` or `edge://extensions`.

> Chromium browsers only allow one-click "Add to Browser" installs for
> extensions listed on an official store (Chrome Web Store / Edge Add-ons).
> A GitHub download always goes through **Developer mode → Load unpacked** —
> that's a browser security restriction, not something specific to this repo.

## What it does

- Clicking **Clear now** calls the browser's own `chrome.browsingData.remove`
  API with exactly two data types: `cache` (+ `cacheStorage`) and `history`.
- **Passwords are deliberately excluded** — the extension never passes
  `passwords: true` to the API.
- **Site settings** (camera/mic/location/notification permissions, etc.)
  aren't part of the `browsingData.remove` surface at all — there's no
  parameter for them, so this extension has no way to touch them even by
  accident.
- Cookies are also left alone by default, so you won't get logged out of
  sites — only cache and history are cleared.
- A "Range" dropdown lets you scope the clear to the last hour/day/week/
  4 weeks, or all time (default).
- A **toolbar badge** flashes a checkmark on the icon for a few seconds after
  a successful clear (or an amber `!` if something went wrong).

## Publish to an extension store (optional)

For a true one-click "Add to Browser" install (no Developer mode toggle),
publish the repo contents to:

- **Chrome Web Store**: zip the repo's contents (not the folder itself,
  and skip `.git`/`.github`/`scripts`) and upload via the [Developer
  Dashboard](https://chrome.google.com/webstore/devconsole) — one-time $5
  registration fee.
- **Brave** doesn't run a separate store; it installs extensions straight
  from the Chrome Web Store, so a Chrome Web Store listing covers Brave too.

This extension only requests the `browsingData` permission and never
collects or transmits any data — worth stating plainly in a store listing.

## Cutting a new release

Maintainers: bump the `version` in `manifest.json`, commit, then:

```bash
git tag v1.1.0
git push origin v1.1.0
```

GitHub Actions (`.github/workflows/release.yml`) packages the extension and
attaches a ready-to-download zip to a new Release automatically.

## Project layout

```
manifest.json    Manifest V3 config, requests only the "browsingData" permission
popup.html       Popup UI
popup.css        Styling + bundled @font-face declarations
popup.js         Click handler — calls chrome.browsingData.remove, drives the badge
icons/           Toolbar icons (16/32/48/128px)
fonts/           Bundled display + mono fonts (OFL licensed, see *-OFL.txt)
logo.png         Standalone wordmark for docs / store listings
scripts/         Python scripts that generated icons/ and logo.png, for future edits
```
