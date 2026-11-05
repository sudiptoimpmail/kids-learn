// Offline cache.
// • App files: one cache per version (bump VERSION on every change). A new version downloads completely,
//   then WAITS; the app switches to it only on the home screen (never in the middle of a game).
// • Voice clips: one cache shared by all versions. Clip file names never change their content
//   (a changed clip gets a new name), so updates never re-download or copy them.
const PREFIX = 'kids-learn-';
const VERSION = PREFIX + 'v49';
const AUDIO = PREFIX + 'audio';
const FILES = ['./', 'index.html', 'style.css', 'ui-improvements.css', 'workbook.css', 'workbook.js', 'photos.js', 'feature-flags.js', 'storage.js', 'grade1words.js', 'content.js', 'thinking.js', 'country.js', 'science.js', 'grammar.js', 'numsense.js', 'grade1.js', 'app.js', 'games.js', 'pathmaze.js', 'radialmaze.js', 'wordgames.js', 'trace.js', 'progress.js', 'ball3d.js', 'pinball3d.js', 'geo.js', 'art.js', 'landmarks.js', 'stories.js', 'words.js', 'phonics.js', 'early-words.js', 'scenes.js', 'body3d.js', 'vendor/three.module.min.js', 'vendor/GLTFLoader.js', 'vendor/BufferGeometryUtils.js', 'vendor/meshopt_decoder.module.js', 'vendor/RoomEnvironment.js', 'vendor/body.glb', 'manifest.webmanifest', 'audio/clips.json', 'audio/silence.mp3',
  'assets/photos/cat.jpg', 'assets/photos/dog.jpg', 'assets/photos/rabbit.jpg', 'assets/photos/duck.jpg', 'assets/photos/elephant.jpg', 'assets/photos/tiger.jpg', 'assets/photos/butterfly.jpg', 'assets/photos/horse.jpg', 'assets/photos/sunflower.jpg', 'assets/photos/rose.jpg', 'assets/photos/tulip.jpg', 'assets/photos/daisy.jpg', 'assets/photos/car.jpg', 'assets/photos/airplane.jpg', 'assets/photos/helicopter.jpg', 'assets/photos/truck.jpg',
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
    const manifest = await (await (await caches.open(VERSION)).match('audio/clips.json') || await fetch('audio/clips.json')).json();
    const corePhrases = [
      'excellent','awesome job','great work','you did it','super star','fantastic',
      'way to go','amazing','wonderful','brilliant','try again','good try',
      'think about it','look carefully and try again','look at the picture',
      'lets play',"let's play",'let s play','hi pick a game','great tracing','beautiful',
      'you finished todays quest open your gift','follow the yellow dots',
      'what comes next','which picture','find the answer','how many',
      'count the tens and ones','count hundreds tens and ones',
      'one more great round unlocks a harder level',
      // Integrated illustrated scenes: cache every required instruction and word offline.
      'help the baby zebra reach its family','follow only the letter z',
      'follow only words with the long a sound to reach tail',
      'tap all the pictures that start with','tap all the circles you see',
      'read the story','what happened first','which word fits','find the word',
      'apple','ant','acorn','airplane','leaf','bird','wolf','water',
      'fish','wash','bench','lunch','rock','sand','sick','rain','cake','ship','chair',
      'wind','jump','catch','bird','climb','water','wolf','thin','wheel','sheep','frog','brick','grass','hand','cat','dog','apple',
    ];
    const core = new Set([...corePhrases, ...Array.from({ length: 21 }, (_, i) => String(i)), ...'abcdefghijklmnopqrstuvwxyz']);
    const entries = Object.entries(manifest).filter(([phrase]) => e.data.type === 'fill-audio-all' || core.has(phrase));
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
