// Offline cache.
// • App files: one cache per version (bump VERSION on every change). A new version downloads completely,
//   then WAITS; the app switches to it only on the home screen (never in the middle of a game).
// • Voice clips: one cache shared by all versions. Clip file names never change their content
//   (a changed clip gets a new name), so updates never re-download or copy them.
const PREFIX = 'kids-learn-';
const VERSION = PREFIX + 'v29';
const AUDIO = PREFIX + 'audio';
const FILES = ['./', 'index.html', 'style.css', 'ui-improvements.css', 'storage.js', 'content.js', 'thinking.js', 'app.js', 'games.js', 'trace.js', 'progress.js', 'ball3d.js', 'pinball3d.js', 'geo.js', 'art.js', 'landmarks.js', 'stories.js', 'words.js', 'phonics.js', 'scenes.js', 'body3d.js', 'vendor/three.module.min.js', 'vendor/GLTFLoader.js', 'vendor/BufferGeometryUtils.js', 'vendor/meshopt_decoder.module.js', 'vendor/RoomEnvironment.js', 'vendor/body.glb', 'manifest.webmanifest', 'audio/clips.json', 'audio/silence.mp3',
  'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'];
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
      for (const k of keys.filter((k) => (k.startsWith(PREFIX) || /^lp-v\d+$/.test(k)) && k !== VERSION && k !== AUDIO)) {
        const oc = await caches.open(k);
        for (const req of await oc.keys()) if (new URL(req.url).pathname.includes('/audio/') && req.url.endsWith('.mp3')) { const r = await oc.match(req); if (r) await audio.put(req, r); }
      }
    }
    // remove only this app's older caches (other apps on the same site keep theirs)
    await Promise.all(keys.filter((k) => ((k.startsWith(PREFIX) && k !== VERSION && k !== AUDIO) || /^lp-v\d+$/.test(k))).map((k) => caches.delete(k)));
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
    if (r.ok && r.type === 'basic') c.put(e.request, r.clone());
    return r;
  })());
});
self.addEventListener('message', (e) => {
  if (!e.data) return;
  // the app says it is on the home screen: switch to the waiting new version now
  if (e.data.type === 'update-now') { self.skipWaiting(); return; }
  // after start-up: download voice clips this phone doesn't have yet, a few at a time; drop ones no longer used
  if (e.data.type === 'fill-audio') e.waitUntil((async () => {
    const audio = await caches.open(AUDIO);
    const clips = await (await (await caches.open(VERSION)).match('audio/clips.json') || await fetch('audio/clips.json')).json();
    const want = new Set([...new Set(Object.values(clips))].map((f) => new URL('audio/' + f, self.registration.scope).href));
    const have = new Set((await audio.keys()).map((r) => r.url));
    for (const u of have) if (!want.has(u)) await audio.delete(u);
    const missing = [...want].filter((u) => !have.has(u));
    for (let i = 0; i < missing.length; i += 20) await audio.addAll(missing.slice(i, i + 20)).catch(() => {});
  })().catch(() => {}));
});
