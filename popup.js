const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const btn = $('#clear-btn');
const btnLabel = btn.querySelector('.btn-label');
const rangeSelect = $('#range');
const statusEl = $('#status');
const statusText = $('#status-text');
const preset = $('#preset');
const customOptions = $('#custom-options');
const scoreEl = $('#score');
const meterFill = $('#meter-fill');
const lastClean = $('#last-clean');

const RANGE_MS = {
  all: 0,
  hour: 3600000,
  day: 86400000,
  week: 604800000,
  month: 2419200000
};

const PRESETS = {
  quick: {
    cache: true,
    cacheStorage: false,
    history: false,
    title: 'Quick cache cleanup'
  },

  standard: {
    cache: true,
    cacheStorage: true,
    history: true,
    title: 'Standard cleanup'
  },

  deep: {
    cache: true,
    cacheStorage: true,
    history: true,
    indexedDB: true,
    serviceWorkers: true,
    localStorage: true,
    fileSystems: true,
    title: 'Deep site + browser cleanup'
  }
};


/* =========================================================
   STATUS
   ========================================================= */

function setStatus(text, error = false) {
  statusText.textContent = text;
  statusEl.classList.toggle('status-error', error);

  // Restart status animation when the message changes
  statusEl.classList.remove('status-update');

  void statusEl.offsetWidth;

  statusEl.classList.add('status-update');
}


/* =========================================================
   HELPERS
   ========================================================= */

function sinceFor(key) {
  const ms = RANGE_MS[key] ?? 0;
  return ms ? Date.now() - ms : 0;
}

function originFor(url) {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

async function activeTab() {
  const tabs = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  return tabs[0];
}

async function currentOrigin() {
  const tab = await activeTab();

  return {
    tab,
    origin: originFor(tab?.url)
  };
}


/* =========================================================
   BUTTON ANIMATION
   ========================================================= */

function setButtonState(button, state, label) {
  if (!button) return;

  button.classList.remove(
    'is-clearing',
    'is-success',
    'is-error'
  );

  if (state) {
    button.classList.add(`is-${state}`);
  }

  const labelEl = button.querySelector('.btn-label');

  if (labelEl) {
    labelEl.textContent = label;
  } else {
    button.textContent = label;
  }
}


function resetButton(button, label) {
  if (!button) return;

  button.classList.remove(
    'is-clearing',
    'is-success',
    'is-error'
  );

  const labelEl = button.querySelector('.btn-label');

  if (labelEl) {
    labelEl.textContent = label;
  } else {
    button.textContent = label;
  }
}


function animateCleanup(
  button,
  success = true,
  normalLabel = 'Clear now'
) {
  if (!button) return;

  setButtonState(
    button,
    success ? 'success' : 'error',
    success ? 'Cleared' : 'Failed'
  );

  setTimeout(() => {
    resetButton(button, normalLabel);
  }, 1800);
}


/* =========================================================
   DATA SELECTION
   ========================================================= */

function selectedData(selector) {
  const data = {};

  $$(selector).forEach((input) => {
    if (input.checked) {
      data[
        input.dataset.type ||
        input.dataset.siteType ||
        input.dataset.devType
      ] = true;
    }
  });

  return data;
}


/* =========================================================
   PRESETS
   ========================================================= */

function setPreset(key) {
  const p = PRESETS[key];

  if (key === 'custom') {
    $('#preset-title').textContent = 'Custom cleanup';
    customOptions.classList.remove('disabled');
    return;
  }

  if (!p) return;

  $('#preset-title').textContent = p.title;

  $$('#custom-options input').forEach((input) => {
    input.checked = !!p[input.dataset.type];
  });

  customOptions.classList.add('disabled');
}


function updatePreview() {
  const p = PRESETS[preset.value];

  const data =
    preset.value === 'custom'
      ? selectedData('#custom-options input')
      : p;

  const names = Object.keys(data)
    .filter(
      (k) => data[k] && k !== 'title'
    )
    .map(
      (k) =>
        ({
          cache: 'Cache',
          cacheStorage: 'Cache Storage',
          history: 'History',
          indexedDB: 'IndexedDB',
          serviceWorkers: 'Service Workers',
          localStorage: 'Local/site storage',
          fileSystems: 'File systems'
        })[k]
    )
    .filter(Boolean);

  $('#quick-preview').textContent =
    names.length
      ? `Will remove: ${names.join(' · ')}`
      : 'Nothing selected';
}


/* =========================================================
   DASHBOARD
   ========================================================= */

async function recordCleanup() {
  const now = Date.now();

  await chrome.storage.local.set({
    lastCleanup: now
  });

  renderDashboard();
}


async function renderDashboard() {
  const {
    lastCleanup,
    autoStartup
  } = await chrome.storage.local.get({
    lastCleanup: 0,
    autoStartup: false
  });

  $('#auto-startup').checked = autoStartup;

  if (lastCleanup) {
    lastClean.textContent =
      `Last cleanup: ${new Date(
        lastCleanup
      ).toLocaleString()}`;
  } else {
    lastClean.textContent =
      'Last cleanup: never';
  }

  const days = lastCleanup
    ? (Date.now() - lastCleanup) / 86400000
    : 99;

  const score = lastCleanup
    ? Math.max(
        35,
        Math.min(
          100,
          Math.round(100 - days * 5)
        )
      )
    : 0;

  scoreEl.textContent = `${score}/100`;

  meterFill.style.width = `${score}%`;
}


/* =========================================================
   QUICK CLEAR
   ========================================================= */

async function clearQuick() {

  btn.disabled = true;

  setButtonState(
    btn,
    'clearing',
    'Clearing…'
  );

  setStatus('clearing_');

  try {

    const p = PRESETS[preset.value];

    const data =
      preset.value === 'custom'
        ? selectedData(
            '#custom-options input'
          )
        : {
            cache: !!p.cache,
            cacheStorage: !!p.cacheStorage,
            history: !!p.history
          };

    if (!Object.keys(data).length) {
      throw new Error(
        'select at least one data type'
      );
    }

    await chrome.browsingData.remove(
      {
        since: sinceFor(
          rangeSelect.value
        )
      },
      data
    );

    await recordCleanup();

    setStatus(
      `done — ${Object.keys(data).join(
        ' + '
      )} cleared`
    );

    /* SUCCESS ANIMATION */
    animateCleanup(
      btn,
      true,
      'Clear now'
    );

  } catch (err) {

    setStatus(
      `error — ${
        err?.message ??
        'could not clear data'
      }`,
      true
    );

    /* ERROR ANIMATION */
    animateCleanup(
      btn,
      false,
      'Clear now'
    );

  } finally {

    setTimeout(() => {
      btn.disabled = false;
    }, 1800);
  }
}


/* =========================================================
   SITE / TROUBLESHOOTING CLEANUP
   ========================================================= */

async function clearSite(
  reload = false
) {

  const button = reload
    ? $('#troubleshoot-btn')
    : $('#site-clear-btn');

  const dataSelector = reload
    ? '[data-dev-type]'
    : '[data-site-type]';

  const originData =
    await currentOrigin();

  if (!originData.origin) {

    setStatus(
      'error — this page cannot be targeted',
      true
    );

    return;
  }

  button.disabled = true;

  setButtonState(
    button,
    'clearing',
    reload
      ? 'Resetting…'
      : 'Clearing…'
  );

  setStatus(
    'targeting current site_'
  );

  try {

    const selected =
      selectedData(dataSelector);

    const data = {};

    if (selected.cache)
      data.cache = true;

    if (selected.cacheStorage)
      data.cacheStorage = true;

    if (selected.cookies)
      data.cookies = true;

    if (selected.localStorage)
      data.localStorage = true;

    if (selected.indexedDB)
      data.indexedDB = true;

    if (selected.serviceWorkers)
      data.serviceWorkers = true;

    if (selected.fileSystems)
      data.fileSystems = true;

    if (!Object.keys(data).length) {
      throw new Error(
        'select at least one data type'
      );
    }

    await chrome.browsingData.remove(
      {
        origins: [
          originData.origin
        ],
        since: 0
      },
      data
    );

    await recordCleanup();

    setStatus(
      `done — ${originData.origin} cleaned`
    );

    /* SUCCESS ANIMATION */
    animateCleanup(
      button,
      true,
      reload
        ? 'Clear & reload'
        : 'Clear this site'
    );

    if (
      reload &&
      originData.tab?.id
    ) {

      await chrome.tabs.reload(
        originData.tab.id,
        {
          bypassCache: true
        }
      );
    }

  } catch (err) {

    setStatus(
      `error — ${
        err?.message ??
        'site cleanup failed'
      }`,
      true
    );

    /* ERROR ANIMATION */
    animateCleanup(
      button,
      false,
      reload
        ? 'Clear & reload'
        : 'Clear this site'
    );

  } finally {

    setTimeout(() => {
      button.disabled = false;
    }, 1800);
  }
}


/* =========================================================
   TABS
   ========================================================= */

$$('.tab').forEach(
  (tab) =>
    tab.addEventListener(
      'click',
      () => {

        $$('.tab').forEach(
          (t) =>
            t.classList.toggle(
              'active',
              t === tab
            )
        );

        $$('.view').forEach(
          (v) =>
            v.classList.toggle(
              'active',
              v.id ===
                `${tab.dataset.tab}-view`
            )
        );

        setStatus(
          tab.dataset.tab === 'quick'
            ? 'ready'
            : 'ready — review before clearing'
        );
      }
    )
);


/* =========================================================
   PRESET EVENTS
   ========================================================= */

preset.addEventListener(
  'change',
  () => {
    setPreset(
      preset.value
    );

    updatePreview();
  }
);


$$('#custom-options input').forEach(
  (i) =>
    i.addEventListener(
      'change',
      updatePreview
    )
);


/* =========================================================
   BUTTON EVENTS
   ========================================================= */

btn.addEventListener(
  'click',
  clearQuick
);

$('#site-clear-btn').addEventListener(
  'click',
  () => clearSite(false)
);

$('#troubleshoot-btn').addEventListener(
  'click',
  () => clearSite(true)
);

$('#settings-btn').addEventListener(
  'click',
  () =>
    $('#settings').classList.toggle(
      'open'
    )
);

$('#auto-startup').addEventListener(
  'change',
  (e) =>
    chrome.storage.local.set({
      autoStartup:
        e.target.checked
    })
);


/* =========================================================
   INITIALIZE
   ========================================================= */

(async () => {

  /* Reset all buttons whenever popup opens */
  resetButton(
    btn,
    'Clear now'
  );

  resetButton(
    $('#site-clear-btn'),
    'Clear this site'
  );

  resetButton(
    $('#troubleshoot-btn'),
    'Clear & reload'
  );

  btn.disabled = false;

  $('#site-clear-btn').disabled =
    false;

  $('#troubleshoot-btn').disabled =
    false;

  setPreset('standard');

  updatePreview();

  renderDashboard();

  try {

    const { origin } =
      await currentOrigin();

    $('#site-origin').textContent =
      origin || 'Unavailable';

    $('#dev-origin').textContent =
      origin || 'Unavailable';

  } catch {

    $('#site-origin').textContent =
      'Unavailable';

    $('#dev-origin').textContent =
      'Unavailable';
  }

})();
