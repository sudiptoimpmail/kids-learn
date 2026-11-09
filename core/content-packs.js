/* kids-core content packs (schema 1, the same downloadable format in every kids-core app).
   Downloaded question packs are DATA, never remote executable code.
   DB name and allowed grades come from app.config.json "packs".
   Store-verified content is installed by trusted native purchase/update plumbing,
   outside child-facing screens. Bundled questions work with no packs at all. */
const ContentPacks = (() => {
  const PACK_CFG = AppConfig.packs || {};
  const DB_NAME = PACK_CFG.db || AppConfig.app.id + '-content-packs';
  const STORE = 'packs';
  const MAX_PACK_BYTES = 2_000_000;
  const GRADES_ALLOWED = (PACK_CFG.grades || ['prek', 'k', 'g1', 'g2', 'g3']).slice();
  const installed = new Map();
  let ready = null;
  const plain = (s) => String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function openDb() {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in globalThis)) return reject(new Error('Offline pack storage is not available'));
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE, { keyPath: 'id' });
      };
      req.onerror = () => reject(req.error || new Error('Could not open offline packs'));
      req.onsuccess = () => resolve(req.result);
    });
  }
  async function readAll() {
    const db = await openDb();
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly');
        const req = tx.objectStore(STORE).getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error || new Error('Could not load offline packs'));
      });
    } finally { db.close(); }
  }
  async function put(pack) {
    const db = await openDb();
    try {
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put(pack);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error || new Error('Could not save pack'));
        tx.onabort = () => reject(tx.error || new Error('Download was not saved'));
      });
    } finally { db.close(); }
  }
  const isSlug = (v) => typeof v === 'string' && /^[a-z0-9][a-z0-9._-]{0,63}$/.test(v);
  const isText = (v, max = 300) => typeof v === 'string' && !!v.trim() && v.length <= max;

  function validate(pack) {
    if (!pack || typeof pack !== 'object' || Array.isArray(pack) ||
        pack.schema !== 1 || !isSlug(pack.id) || !isSlug(pack.entitlement) ||
        !Number.isSafeInteger(pack.version) || pack.version < 1 || !isText(pack.title, 80) ||
        !Array.isArray(pack.questions) || pack.questions.length < 1 || pack.questions.length > 4000 ||
        JSON.stringify(pack).length > MAX_PACK_BYTES) throw new Error('Invalid content pack');
    const keys = new Set();
    for (const q of pack.questions) {
      if (!q || !isSlug(q.id) || keys.has(q.id) || !isSlug(q.category) ||
          (typeof CATEGORIES !== 'undefined' && !CATEGORIES.some(c => c.id === q.category && c.gen && q.level <= (c.maxLevel || 3))) ||
          !Array.isArray(q.grades) || !q.grades.length ||
          !q.grades.every((g) => GRADES_ALLOWED.includes(g)) ||
          (typeof gradeRange === 'function' && !q.grades.every((g) => {
            const range = gradeRange(g, q.category);
            return range && q.level >= range[0] && q.level <= range[1];
          })) ||
          !Number.isSafeInteger(q.level) || q.level < 1 || q.level > 11 ||
          !isText(q.prompt, 350) || !isText(q.answer, 120) ||
          !Array.isArray(q.choices) || q.choices.length < 3 || q.choices.length > 4 ||
          !q.choices.every((v) => isText(v, 120)) ||
          new Set(q.choices).size !== q.choices.length ||
          q.choices.filter((v) => v === q.answer).length !== 1 ||
          (q.explanation != null && !isText(q.explanation, 400)) ||
          (q.image != null && (typeof q.image !== 'string' ||
            !/^assets\/(?:photos|illustrations)\/[a-z0-9_-]+\.(?:jpg|svg)$/.test(q.image) ||
            (typeof visualPath === 'function' && visualPath(q.image.split('/').pop().split('.')[0]) !== q.image)))) {
        throw new Error('Pack contains a malformed or ambiguous question');
      }
      keys.add(q.id);
    }
    return pack;
  }
  function load() {
    if (!ready) ready = readAll().then((all) => {
      for (const pack of all) {
        try { validate(pack); installed.set(pack.id, pack); }
        catch (err) { console.warn('Skipping invalid learning pack', err); }
      }
      return installed.size;
    }).catch((err) => {
      // Browser private mode / quota failure must not disable bundled lessons.
      console.warn('Offline learning packs are unavailable', err);
      return 0;
    });
    return ready;
  }
  // Do not invoke this with arbitrary URLs or in child-facing code. The native
  // purchase service must authorize, fetch and verify the data FIRST.
  async function installVerified(pack) {
    validate(pack);
    await load();
    const old = installed.get(pack.id);
    if (old && old.version > pack.version) throw new Error('Pack version would go backwards');
    await put(pack);  // transaction completes before the new pack becomes visible
    installed.set(pack.id, pack);
    return installed.size;
  }
  function choose(grade, category, level, exclude = []) {
    if (!ready) { void load(); return null; }
    const options = [];
    for (const pack of installed.values()) {
      for (const q of pack.questions) {
        if (q.category === category && q.level === level && q.grades.includes(grade) &&
            !exclude.includes('pack:' + pack.id + ':' + q.id)) options.push({pack, q});
      }
    }
    if (!options.length) return null;
    const {pack, q} = options[Math.floor(Math.random() * options.length)];
    const image = q.image ? `<img src="${q.image}" alt="" class="pack-question-image" loading="lazy">` : '';
    return {
      key: 'pack:' + pack.id + ':' + q.id,
      text: plain(q.prompt), say: [], main: image,
      options: q.choices.map((v) => ({v, html: plain(v)})),
      answer: q.answer, grades: q.grades.slice(),
      hint: q.explanation ? {html: plain(q.explanation), say: []} : {html: '', say: [], remove: true},
      packId: pack.id
    };
  }
  function summary() {
    return [...installed.values()].map((p) => ({id:p.id, title:p.title, version:p.version, questions:p.questions.length}));
  }
  return Object.freeze({load, validate, installVerified, choose, summary});
})();
