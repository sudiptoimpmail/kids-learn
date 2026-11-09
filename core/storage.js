/* =========================================================
   kids-core storage: the one place where progress and settings are saved.
   The key, device-wide settings, pictures and child defaults come from app.config.json "storage".
   Web (today): the browser's localStorage, saved right away.
   Native app (later): the same data is also copied to the app's own
   storage (Capacitor Preferences) so iOS can never clear it, and it is
   restored from there if the web storage is ever empty.
   See docs/launch-architecture.md for the full plan.
   ========================================================= */
const STORE_CFG = AppConfig.storage;
const STORE_KEY = STORE_CFG.key;
const SCHEMA = 3;            // bump when the shape of the saved data changes, and add a step to migrate()
// saved once for the whole device; everything else belongs to one child
const DEVICE_KEYS = STORE_CFG.deviceKeys.slice();
const AVATARS = AppConfig.avatars.slice();
const MAX_KIDS = STORE_CFG.maxKids || 4;
const MAX_LEVEL = STORE_CFG.maxLevel || 9;
const profileDefaults = () => Object.assign({ name: '', avatar: AVATARS[0], stars: 0, stickers: [], levels: {}, best: {}, recent: {}, traced: {} },
  JSON.parse(JSON.stringify(STORE_CFG.profileDefaults || {})));

/* Saved shape (schema 3):
   { schema, savedAt, active: 'p1', order: ['p1', 'p2'],
     device: { voice, pinHash, play-time rules … },
     profiles: { p1: { name, avatar, grade, theme, levels, stars, stickers, … }, p2: { … } } }
   The app works with one flat `state` object = device settings + the active child's data. */
const Store = {
  ok: true,                  // false when the last save failed (storage full or blocked)
  onError: null,             // the app shows a note to grown-ups when saving fails
  root: null,
  load() {
    let data = {};
    try { data = JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch {}
    Store.loadedAt = data.savedAt || 0;          // what the app started with (saves made at start-up don't count)
    Store.root = Store.migrate(data);
    return Store.flat();
  },
  flat() { const r = Store.root; return Object.assign(profileDefaults(), r.profiles[r.active], r.device); },
  // split the app's flat state back into device settings and the active child's data
  absorb(state) {
    const r = Store.root, dev = {}, kid = {};
    for (const [k, v] of Object.entries(state)) { if (k === 'schema' || k === 'savedAt') continue; (DEVICE_KEYS.includes(k) ? dev : kid)[k] = v; }
    r.device = dev; r.profiles[r.active] = kid;
  },
  save(state) {
    if (Store.frozen) return;          // a backup was just loaded and the app is reloading: don't write over it
    Store.absorb(state);
    const r = Store.root; r.schema = SCHEMA; r.savedAt = Date.now();
    const json = JSON.stringify(r);
    try { localStorage.setItem(STORE_KEY, json); Store.ok = true; }
    catch (e) { Store.ok = false; if (Store.onError) Store.onError(e); }
    // native app: also keep a copy in the app's own storage (iOS never clears it).
    // Writes wait until start-up restore has finished, then go one at a time, newest last.
    const native = Store.native();
    if (native) {
      // one write at a time, always the newest data; a failed write is tried again with the next save
      Store.pending = json;
      Store.chain = (Store.chain || Store.ready).catch(() => {}).then(async () => {
        const latest = Store.pending; if (!latest) return;
        Store.pending = null;
        try { await native.set({ key: STORE_KEY, value: latest }); }
        catch (e) { if (!Store.pending) Store.pending = latest; if (Store.onError) Store.onError(e); }
      });
    }
  },
  // older saved data → today's shape
  migrate(d) {
    if (!d || typeof d !== 'object' || Array.isArray(d)) d = {};
    if (d.profiles && (typeof d.profiles !== 'object' || Array.isArray(d.profiles))) delete d.profiles;
    if (!d.profiles) {
      // schema 1–2: one child, everything in one flat object
      d.recent = d.recent || {};
      d.traced = d.traced || {};
      const dev = {}, kid = {};
      for (const [k, v] of Object.entries(d)) { if (k === 'schema' || k === 'savedAt') continue; (DEVICE_KEYS.includes(k) ? dev : kid)[k] = v; }
      kid.avatar = kid.avatar || AVATARS[0];
      d = { schema: SCHEMA, savedAt: d.savedAt || 0, active: 'p1', order: ['p1'], device: dev, profiles: { p1: kid } };
    }
    // keep only well-formed children: an id like p1, an object, a plain-text name, a known picture
    for (const [id, p] of Object.entries(d.profiles)) {
      if (!/^p\d{1,3}$/.test(id) || !p || typeof p !== 'object' || Array.isArray(p)) { delete d.profiles[id]; continue; }
      p.name = typeof p.name === 'string' ? p.name.replace(/[<>&"'`]/g, '').slice(0, 20) : '';
      if (!AVATARS.includes(p.avatar)) p.avatar = AVATARS[0];
      for (const k of ['levels', 'best', 'recent', 'traced', 'stats']) if (p[k] != null && (typeof p[k] !== 'object' || Array.isArray(p[k]))) delete p[k];
      if (!Array.isArray(p.stickers)) p.stickers = [];
      const obj = (v) => v && typeof v === 'object' && !Array.isArray(v);
      if (p.stats != null) { if (!obj(p.stats)) delete p.stats; else { if (!obj(p.stats.days)) p.stats.days = {}; if (!obj(p.stats.skills)) p.stats.skills = {}; if (!obj(p.stats.objectives)) p.stats.objectives = {}; } }
      if (p.quest != null && !(obj(p.quest) && Array.isArray(p.quest.steps) && p.quest.steps.every((x) => obj(x) && typeof x.cat === 'string'))) delete p.quest;
      if (p.levels) for (const [k, v] of Object.entries(p.levels)) if (!(Number.isInteger(v) && v >= 1 && v <= MAX_LEVEL)) delete p.levels[k];
      if (typeof p.stars !== 'number' || !(p.stars >= 0)) p.stars = 0;
    }
    d.order = (Array.isArray(d.order) ? d.order : Object.keys(d.profiles)).filter((id, i, a) => d.profiles[id] && a.indexOf(id) === i).slice(0, MAX_KIDS);
    if (!d.order.length) { d.profiles = { p1: profileDefaults() }; d.order = ['p1']; }
    if (!d.profiles[d.active]) d.active = d.order[0];
    d.device = d.device && typeof d.device === 'object' && !Array.isArray(d.device) ? d.device : {};
    for (const k of Object.keys(d.device)) if (!DEVICE_KEYS.includes(k)) delete d.device[k];
    d.schema = SCHEMA;
    return d;
  },
  /* ---------- children ---------- */
  kids: () => Store.root.order.map((id) => ({ id, ...Store.root.profiles[id] })),
  activeId: () => Store.root.active,
  // switch the app's state object to another child (in place, so every screen sees it)
  switchTo(id, state) {
    if (!Store.root.profiles[id]) return;
    Store.save(state);
    for (const k of Object.keys(state)) if (!DEVICE_KEYS.includes(k)) delete state[k];
    Store.root.active = id;
    Object.assign(state, Store.flat());
    Store.save(state);
  },
  addKid(meta, state) {
    if (Store.root.order.length >= MAX_KIDS) return null;
    let n = Store.root.order.length + 1; while (Store.root.profiles['p' + n]) n++;
    const id = 'p' + n;
    const used = new Set(Store.kids().map((k) => k.avatar));
    Store.root.profiles[id] = Object.assign(profileDefaults(), { avatar: AVATARS.find((a) => !used.has(a)) || AVATARS[0] }, meta);
    Store.root.order.push(id);
    Store.switchTo(id, state);
    return id;
  },
  removeKid(id, state) {
    if (Store.root.order.length <= 1) return false;
    if (Store.root.active === id) Store.switchTo(Store.root.order.find((x) => x !== id), state);
    delete Store.root.profiles[id];
    Store.root.order = Store.root.order.filter((x) => x !== id);
    Store.save(state);
    return true;
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
        if ((theirs.savedAt || 0) > Store.loadedAt) {
          // Startup had already rendered the web copy. Replace it atomically and restart.
          // Clear queued older writes, so they cannot overwrite the recovered native copy.
          Store.frozen = true;
          Store.pending = null;
          localStorage.setItem(STORE_KEY, JSON.stringify(Store.migrate(theirs)));
          location.replace(location.href);
          return;
        }
      } catch {}
    })();
  },
  // a grown-up can download a backup and load it on another device (same file format in every kids-core app)
  exportJSON: () => localStorage.getItem(STORE_KEY) || '{}',
  backupName: () => `${STORE_CFG.backupName || AppConfig.app.id + '-backup'}-${new Date().toISOString().slice(0, 10)}.json`,
  downloadBackup() {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([Store.exportJSON()], { type: 'application/json' }));
    a.download = Store.backupName(); a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  },
  // another kids-core app on the same website (for the shared grown-up PIN); read-only
  peek(key) { try { const d = JSON.parse(localStorage.getItem(key)); return d && typeof d === 'object' ? d : null; } catch { return null; } },
  importJSON(text) {
    const d = JSON.parse(text);
    // only a real backup from this app: an object with the fields the app saves
    if (typeof d !== 'object' || !d || Array.isArray(d) || !('profiles' in d || 'levels' in d || 'stars' in d) || text.length > 5e6) throw new Error('not a backup');
    const m = Store.migrate(d); m.savedAt = Date.now();
    Store.frozen = true;
    localStorage.setItem(STORE_KEY, JSON.stringify(m));
  },
};
Store.ready = Store.restoreIfNeeded();
