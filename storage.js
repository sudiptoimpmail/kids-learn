/* =========================================================
   Storage: the one place where progress and settings are saved.
   Web (today): the browser's localStorage, saved right away.
   Native app (later): the same data is also copied to the app's own
   storage (Capacitor Preferences) so iOS can never clear it, and it is
   restored from there if the web storage is ever empty.
   See docs/launch-architecture.md for the full plan.
   ========================================================= */
const STORE_KEY = 'learnplay.v1';
const SCHEMA = 2;            // bump when the shape of the saved data changes, and add a step to migrate()

const Store = {
  load() {
    let data = {};
    try { data = JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch {}
    return Store.migrate(data);
  },
  save(data) {
    data.schema = SCHEMA; data.savedAt = Date.now();
    const json = JSON.stringify(data);
    try { localStorage.setItem(STORE_KEY, json); } catch {}
    // native app: keep a second copy in the app's own storage (not cleared by iOS)
    const native = Store.native();
    if (native) { clearTimeout(Store.t); Store.t = setTimeout(() => native.set({ key: STORE_KEY, value: json }).catch(() => {}), 400); }
  },
  // older saved data → today's shape
  migrate(d) {
    if (!d.schema || d.schema < 2) {
      d.recent = d.recent || {};          // questions seen lately (so they don't repeat)
      d.traced = d.traced || {};          // letters and numbers already traced
    }
    d.schema = SCHEMA;
    return d;
  },
  native: () => (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) || null,
  // native app start-up: if the web copy is missing, bring back the app's copy and reload once
  async restoreIfNeeded() {
    const native = Store.native(); if (!native) return;
    try {
      const { value } = await native.get({ key: STORE_KEY });
      if (value && !localStorage.getItem(STORE_KEY)) { localStorage.setItem(STORE_KEY, value); location.reload(); }
    } catch {}
  },
  // a grown-up can download a backup and load it on another device
  exportJSON: () => localStorage.getItem(STORE_KEY) || '{}',
  importJSON(text) { const d = JSON.parse(text); if (typeof d !== 'object' || !d) throw new Error('not a backup'); localStorage.setItem(STORE_KEY, JSON.stringify(Store.migrate(d))); },
};
Store.restoreIfNeeded();
