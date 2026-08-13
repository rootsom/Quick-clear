const BASE_DATA_TYPES = { cache: true, cacheStorage: true, history: true };
const RANGE_MS = { all: 0, hour: 3600000, day: 86400000, week: 604800000, month: 2419200000 };

function sinceFor(key = 'all') {
  const span = RANGE_MS[key] ?? 0;
  return span ? Date.now() - span : 0;
}

async function clearBase(range = 'all') {
  await chrome.browsingData.remove({ since: sinceFor(range) }, BASE_DATA_TYPES);
}

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'quick-clear') return;
  try {
    await clearBase('all');
    await chrome.action.setBadgeText({ text: '✓' });
    await chrome.action.setBadgeBackgroundColor({ color: '#3ed6b5' });
    setTimeout(() => chrome.action.setBadgeText({ text: '' }), 3500);
  } catch {
    await chrome.action.setBadgeText({ text: '!' });
    await chrome.action.setBadgeBackgroundColor({ color: '#e8935a' });
  }
});

chrome.runtime.onStartup.addListener(async () => {
  try {
    const { autoStartup } = await chrome.storage.local.get({ autoStartup: false });
    if (autoStartup) await chrome.browsingData.remove({ since: 0 }, { cache: true, cacheStorage: true });
  } catch {
    // Never block browser startup because cleanup preferences fail.
  }
});
