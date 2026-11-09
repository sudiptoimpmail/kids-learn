/* kids-core service worker logic. The app's own sw.js defines, then imports this file:
     const PREFIX = 'my-app-';            // cache name prefix (unique per app on the same website)
     const VERSION = PREFIX + 'v1';       // bump on every release
     const AUDIO = PREFIX + 'audio';      // shared voice-clip cache
     const FILES = [ ... ];               // everything the app needs offline
     const CORE_PHRASES = [ ... ];        // optional: voice clips cached right away (by phrase)
     const LEGACY_CACHES = /^$/;          // optional: older cache names to remove
     const AUDIO_MAPS = ['audio/clips.json'];   // optional: every voice clip map
     importScripts('core/sw-core.js');
   • App files: one cache per version. A new version downloads completely, then WAITS;
     the app switches to it only when a grown-up taps the update note on the home screen.
   • Voice clips: one cache shared by all versions (a changed clip gets a new file name). */
const LEGACY = typeof LEGACY_CACHES !== 'undefined' ? LEGACY_CACHES : /^$/;
const CLIP_MAPS = typeof AUDIO_MAPS !== 'undefined' ? AUDIO_MAPS : ['audio/clips.json'];
const SCOPE = new URL('./', self.location).pathname;   // e.g. /kids-learn/ — never touch other apps on the same site

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' })))));   // all or nothing
});
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    const audio = await caches.open(AUDIO);
    // one time: move voice clips out of older version caches into the shared voice cache
    if (!(await audio.keys()).length) {
      for (const k of keys.filter((k) => (k.startsWith(PREFIX) || LEGACY.test(k)) && k !== VERSION && k !== AUDIO)) {
        const oc = await caches.open(k);
        for (const req of await oc.keys()) if (new URL(req.url).pathname.includes('/audio/') && req.url.endsWith('.mp3')) { const r = await oc.match(req); if (r) await audio.put(req, r); }
      }
    }
    // remove only this app's older caches (other apps on the same site keep theirs)
    await Promise.all(keys.filter((k) => ((k.startsWith(PREFIX) && k !== VERSION && k !== AUDIO) || LEGACY.test(k))).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (e.request.headers.has('range')) return;          // let the browser stream <audio> itself (iOS needs real 206 responses)
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(SCOPE)) return;
  const isClip = url.pathname.includes('/audio/') && url.pathname.endsWith('.mp3');
  e.respondWith((async () => {
    const c = await caches.open(isClip ? AUDIO : VERSION);
    const hit = await c.match(e.request, { ignoreSearch: true });
    if (hit) return hit;
    const r = await fetch(e.request);
    if (r.ok && r.type === 'basic') {
      // Keep this fetch alive until its cache write finishes; otherwise the browser
      // can terminate the worker and silently lose the offline copy.
      try { await c.put(e.request, r.clone()); } catch {} // quota full: still return the network response
    }
    return r;
  })());
});
self.addEventListener('message', (e) => {
  if (!e.data) return;
  // the app says it is on the home screen: switch to the waiting new version now
  if (e.data.type === 'update-now') { self.skipWaiting(); return; }
  // Default: cache a small starter pack and cache everything else on first use.
  // An adult may explicitly request the complete (large) recorded voice library.
  if (e.data.type === 'fill-audio' || e.data.type === 'fill-audio-all') e.waitUntil((async () => {
    const audio = await caches.open(AUDIO);
    const manifest = {};
    for (const m of CLIP_MAPS) {   // a map that cannot be read stops the fill, so no cached clip is dropped by mistake
      const map = await (await (await caches.open(VERSION)).match(m) || await fetch(m)).json();
      for (const [k, f] of Object.entries(map)) manifest[m + '|' + k] = f;
    }
    const corePhrases = typeof CORE_PHRASES !== 'undefined' ? CORE_PHRASES : [];
    const core = new Set([...corePhrases, ...Array.from({ length: 21 }, (_, i) => String(i)), ...'abcdefghijklmnopqrstuvwxyz']);
    const entries = Object.entries(manifest).filter(([key]) => e.data.type === 'fill-audio-all' || core.has(key.slice(key.indexOf('|') + 1)));
    const want = [...new Set(entries.map(([, file]) => new URL('audio/' + file, self.registration.scope).href))];
    // drop clips the app no longer uses (a changed clip gets a new file name)
    const all = new Set(Object.values(manifest).map((file) => new URL('audio/' + file, self.registration.scope).href));
    for (const req of await audio.keys()) if (!all.has(req.url)) await audio.delete(req);
    const have = new Set((await audio.keys()).map((req) => req.url));
    const missing = want.filter((url) => !have.has(url));
    const source = e.source;
    let saved = 0;
    const report = (done) => { try { source && source.postMessage({ type: 'audio-pack-progress', mode: e.data.type, done, total: missing.length, saved }); } catch {} };
    report(0);
    // Small batches avoid a single huge request and leave prior cached clips intact.
    for (let i = 0; i < missing.length; i += 20) {
      await Promise.all(missing.slice(i, i + 20).map(async (url) => {
        try { const response = await fetch(url); if (response.ok) { await audio.put(url, response); saved++; } } catch {}
      }));
      if (e.data.type === 'fill-audio-all' && (i % 100 === 0 || i + 20 >= missing.length)) report(Math.min(i + 20, missing.length));
    }
    report(missing.length);
  })().catch(() => {}));
});
