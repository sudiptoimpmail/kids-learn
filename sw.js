// Offline cache. Bump VERSION whenever you change any file so phones/iPads pick up the update.
// A new version is downloaded completely into its own cache before it is used, so the app never
// mixes files from two versions (even if the internet drops halfway through an update).
const PREFIX = 'kids-learn-';
const VERSION = PREFIX + 'v26';
const FILES = ['./', 'index.html', 'style.css', 'storage.js', 'content.js', 'app.js', 'games.js', 'trace.js', 'progress.js', 'ball3d.js', 'pinball3d.js', 'geo.js', 'art.js', 'landmarks.js', 'stories.js', 'words.js', 'phonics.js', 'scenes.js', 'body3d.js', 'vendor/three.module.min.js', 'vendor/GLTFLoader.js', 'vendor/BufferGeometryUtils.js', 'vendor/meshopt_decoder.module.js', 'vendor/RoomEnvironment.js', 'vendor/body.glb', 'manifest.webmanifest', 'audio/clips.json', 'audio/silence.mp3',
  'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'];
const SCOPE = new URL('./', self.location).pathname;   // e.g. /kids-learn/ — never touch other apps on the same site

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    await c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' })));   // all or nothing, fresh from the site
    // voice clips: reuse the ones this phone already has (no download here, so updates install fast)
    try {
      const clips = await (await fetch('audio/clips.json', { cache: 'no-store' })).json();
      const files = [...new Set(Object.values(clips))].map((f) => 'audio/' + f);
      const old = (await caches.keys()).filter((k) => k.startsWith(PREFIX) && k !== VERSION);
      for (const k of old) {
        const oc = await caches.open(k);
        for (const f of files) { const hit = await oc.match(f); if (hit) await c.put(f, hit); }
      }
    } catch {}
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', (e) => {
  // remove only this app's older caches (other apps on the same site keep theirs)
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => (k.startsWith(PREFIX) && k !== VERSION) || /^lp-v\d+$/.test(k)).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// every app file comes from this version's cache (falls back to the network for anything missing)
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (e.request.headers.has('range')) return;          // let the browser stream <audio> itself (iOS needs real 206 responses)
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(SCOPE)) return;
  e.respondWith((async () => {
    const c = await caches.open(VERSION);
    const hit = await c.match(e.request, { ignoreSearch: true });
    if (hit) return hit;
    const r = await fetch(e.request);
    if (r.ok && r.type === 'basic') c.put(e.request, r.clone());
    return r;
  })());
});
// the app asks for the missing voice clips once it is running: downloaded quietly, a few at a time
self.addEventListener('message', (e) => {
  if (!e.data || e.data.type !== 'fill-audio') return;
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    const clips = await (await fetch('audio/clips.json')).json();
    const files = [...new Set(Object.values(clips))].map((f) => 'audio/' + f);
    const missing = [];
    for (const f of files) if (!(await c.match(f))) missing.push(f);
    for (let i = 0; i < missing.length; i += 20) await c.addAll(missing.slice(i, i + 20)).catch(() => {});
  })().catch(() => {}));
});
