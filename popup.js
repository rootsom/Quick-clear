const btn = document.getElementById("clear-btn");
const btnLabel = btn.querySelector(".btn-label");
const rangeSelect = document.getElementById("range");
const statusEl = document.getElementById("status");
const statusText = document.getElementById("status-text");

const siteFixBtn = document.getElementById("site-fix-btn");
const siteDomainEl = document.getElementById("site-domain");
const includeCookiesEl = document.getElementById("include-cookies");

// Data cleared by "Fix this site". Cookies are deliberately left out by
// default so a broken/stale page can be fixed without logging the user
// out — cache and storage are almost always the actual culprit, not
// the session cookie. The user can opt in to also clearing cookies.
const SITE_DATA_TYPES_BASE = {
  cache: true,
  cacheStorage: true,
  serviceWorkers: true,
  indexedDB: true,
  localStorage: true,
};

let currentOrigin = null;

async function detectCurrentSite() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = new URL(tab.url);
    if (!/^https?:$/.test(url.protocol)) {
      throw new Error("not a web page");
    }
    currentOrigin = url.origin;
    siteDomainEl.textContent = url.hostname;
    siteFixBtn.disabled = false;
  } catch {
    currentOrigin = null;
    siteDomainEl.textContent = "no site detected";
    siteFixBtn.disabled = true;
  }
}
detectCurrentSite();

// Only these two data types are ever passed to the API.
// Passwords are deliberately excluded. Site permission settings
// (camera/location/notifications, etc.) aren't part of the
// browsingData.remove surface at all, so this extension has no
// way to touch them even if it wanted to.
const DATA_TYPES = {
  cache: true,
  cacheStorage: true,
  history: true,
};

const RANGE_MS = {
  all: 0,
  hour: 60 * 60 * 1000,
  day: 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  month: 28 * 24 * 60 * 60 * 1000,
};

function setStatus(text, isError = false) {
  statusText.textContent = text;
  statusEl.classList.toggle("status-error", isError);
}

function sinceFor(rangeKey) {
  const span = RANGE_MS[rangeKey] ?? 0;
  return span === 0 ? 0 : Date.now() - span;
}

function timeLabel() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

// Flashes a badge on the toolbar icon so the result is visible even
// after the popup is closed. Clears itself after a few seconds.
let badgeTimeout;
function flashBadge(text, color) {
  clearTimeout(badgeTimeout);
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color });
  badgeTimeout = setTimeout(() => {
    chrome.action.setBadgeText({ text: "" });
  }, 4000);
}

siteFixBtn.addEventListener("click", async () => {
  if (!currentOrigin) return;

  siteFixBtn.disabled = true;
  const originalLabel = siteFixBtn.textContent;
  siteFixBtn.textContent = "Fixing…";
  setStatus(`clearing ${new URL(currentOrigin).hostname}_`);

  const dataToRemove = { ...SITE_DATA_TYPES_BASE };
  if (includeCookiesEl.checked) {
    dataToRemove.cookies = true;
  }

  try {
    await chrome.browsingData.remove(
      { since: 0, origins: [currentOrigin] },
      dataToRemove
    );
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) chrome.tabs.reload(tab.id);

    const loggedOutNote = includeCookiesEl.checked ? " (cookies cleared)" : "";
    setStatus(`done — ${new URL(currentOrigin).hostname} fixed at ${timeLabel()}${loggedOutNote}`);
    flashBadge("✓", "#3ed6b5");
  } catch (err) {
    setStatus(`error — ${err?.message ?? "could not clear site data"}`, true);
    flashBadge("!", "#e8935a");
  } finally {
    siteFixBtn.disabled = false;
    siteFixBtn.textContent = originalLabel;
  }
});

btn.addEventListener("click", async () => {
  btn.disabled = true;
  btnLabel.textContent = "Clearing…";
  setStatus("clearing_");

  const since = sinceFor(rangeSelect.value);

  try {
    await chrome.browsingData.remove({ since }, DATA_TYPES);
    setStatus(`done — cache & history cleared at ${timeLabel()}`);
    flashBadge("✓", "#3ed6b5");
  } catch (err) {
    setStatus(`error — ${err?.message ?? "could not clear data"}`, true);
    flashBadge("!", "#e8935a");
  } finally {
    btn.disabled = false;
    btnLabel.textContent = "Clear now";
  }
});
