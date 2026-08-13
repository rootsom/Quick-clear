const btn = document.getElementById("clear-btn");
const btnLabel = btn.querySelector(".btn-label");
const rangeSelect = document.getElementById("range");
const statusEl = document.getElementById("status");
const statusText = document.getElementById("status-text");

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

// Toolbar badge: a short-lived confirmation mark on the extension icon,
// so you know it worked even if you clicked and moved on. Clears itself
// after a few seconds, and always resets on popup open so it never gets
// stuck showing a stale state.
let badgeTimer;

function flashBadge(text, color) {
  clearTimeout(badgeTimer);
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color });
  badgeTimer = setTimeout(() => chrome.action.setBadgeText({ text: "" }), 4000);
}

chrome.action.setBadgeText({ text: "" });

btn.addEventListener("click", async () => {
  btn.disabled = true;
  btnLabel.textContent = "Clearing…";
  setStatus("clearing_");

  const since = sinceFor(rangeSelect.value);

  try {
    await chrome.browsingData.remove({ since }, DATA_TYPES);
    setStatus(`done — cache & history cleared at ${timeLabel()}`);
    flashBadge("✓", "#3ED6B5");
  } catch (err) {
    setStatus(`error — ${err?.message ?? "could not clear data"}`, true);
    flashBadge("!", "#E8935A");
  } finally {
    btn.disabled = false;
    btnLabel.textContent = "Clear now";
  }
});
