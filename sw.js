// Offline cache. Bump VERSION whenever you change any file so phones/iPads pick up the update.
const VERSION = 'lp-v20';
const FILES = ['./', 'index.html', 'style.css', 'storage.js', 'content.js', 'app.js', 'games.js', 'trace.js', 'ball3d.js', 'pinball3d.js', 'geo.js', 'art.js', 'landmarks.js', 'stories.js', 'scenes.js', 'body3d.js', 'vendor/three.module.min.js', 'vendor/GLTFLoader.js', 'vendor/BufferGeometryUtils.js', 'vendor/meshopt_decoder.module.js', 'vendor/RoomEnvironment.js', 'vendor/body.glb', 'manifest.webmanifest', 'audio/clips.json', 'audio/silence.mp3',
  'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    await c.addAll(FILES);
    // voice clips: fetch in the background, a failure here never blocks the app
    try {
      const clips = await (await fetch('audio/clips.json')).json();
      const files = [...new Set(Object.values(clips))].map((f) => 'audio/' + f);
      for (let i = 0; i < files.length; i += 40) await c.addAll(files.slice(i, i + 40)).catch(() => {});
    } catch {}
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// app files: network first (so updates show up); voice clips: cache first (they never change)
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (e.request.headers.has('range')) return; // let the browser stream <audio> itself (iOS needs real 206 responses)
  const url = new URL(e.request.url);
  if (url.pathname.includes('/audio/') && url.pathname.endsWith('.mp3')) {
    e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((r) => {
      const copy = r.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); return r;
    })));
    return;
  }
  e.respondWith(
    fetch(e.request).then((r) => {
      const copy = r.clone();
      caches.open(VERSION).then((c) => c.put(e.request, copy));
      return r;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
