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
  ok: true,                  // false when the last save failed (storage full or blocked)
  onError: null,             // the app shows a note to grown-ups when saving fails
  load() {
    let data = {};
    try { data = JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch {}
    Store.loadedAt = data.savedAt || 0;          // what the app started with (saves made at start-up don't count)
    return Store.migrate(data);
  },
  save(data) {
    data.schema = SCHEMA; data.savedAt = Date.now();
    const json = JSON.stringify(data);
    try { localStorage.setItem(STORE_KEY, json); Store.ok = true; }
    catch (e) { Store.ok = false; if (Store.onError) Store.onError(e); }
    // native app: also keep a copy in the app's own storage (iOS never clears it).
    // Writes wait until start-up restore has finished, then go one at a time, newest last.
    const native = Store.native();
    if (native) {
      Store.pending = json;
      Store.chain = Store.ready.then(async () => {
        if (Store.pending !== json) return;          // a newer save will write instead
        try { await native.set({ key: STORE_KEY, value: json }); } catch (e) { if (Store.onError) Store.onError(e); }
      });
    }
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
  // native app start-up: if the app's own copy is newer than the web copy (or the web copy is gone), use it
  ready: Promise.resolve(),
  restoreIfNeeded() {
    const native = Store.native(); if (!native) return Promise.resolve();
    return (async () => {
      try {
        const { value } = await native.get({ key: STORE_KEY });
        if (!value) return;
        const theirs = JSON.parse(value);
        if (Store.loadedAt == null) { try { Store.loadedAt = (JSON.parse(localStorage.getItem(STORE_KEY)) || {}).savedAt || 0; } catch { Store.loadedAt = 0; } }
        if ((theirs.savedAt || 0) > Store.loadedAt) { localStorage.setItem(STORE_KEY, value); location.reload(); await new Promise(() => {}); }
      } catch {}
    })();
  },
  // a grown-up can download a backup and load it on another device
  exportJSON: () => localStorage.getItem(STORE_KEY) || '{}',
  importJSON(text) {
    const d = JSON.parse(text);
    // only a real Learn & Play backup: an object with the fields the app saves
    if (typeof d !== 'object' || !d || Array.isArray(d) || !('levels' in d || 'stars' in d) || text.length > 5e6) throw new Error('not a backup');
    d.savedAt = Date.now();
    localStorage.setItem(STORE_KEY, JSON.stringify(Store.migrate(d)));
  },
};
Store.ready = Store.restoreIfNeeded();
