// Offline cache.
// • App files: one cache per version (bump VERSION on every change). A new version downloads completely,
//   then WAITS; the app switches to it only on the home screen (never in the middle of a game).
// • Voice clips: one cache shared by all versions. Clip file names never change their content
//   (a changed clip gets a new name), so updates never re-download or copy them.
const PREFIX = 'kids-learn-';
const VERSION = PREFIX + 'v61';
const AUDIO = PREFIX + 'audio';
const FILES = [
  "./",
  "index.html",
  "style.css",
  "ui-improvements.css",
  "workbook.css",
  "workbook.js",
  "photos.js",
  "illustrations.js",
  "feature-flags.js",
  "storage.js",
  "grade1words.js",
  "content.js",
  "content-loader.js",
  "content-packs.js",
  "thinking.js",
  "country.js",
  "science.js",
  "grammar.js",
  "numsense.js",
  "grade1.js",
  "app.js",
  "games.js",
  "pathmaze.js",
  "radialmaze.js",
  "wordgames.js",
  "trace.js",
  "progress.js",
  "ball3d.js",
  "pinball3d.js",
  "geo.js",
  "art-engine.js",
  "landmark-engine.js",
  "story-engine.js",
  "words.js",
  "phonics.js",
  "early-words.js",
  "scene-engine.js",
  "body3d.js",
  "vendor/three.module.min.js",
  "vendor/GLTFLoader.js",
  "vendor/BufferGeometryUtils.js",
  "vendor/meshopt_decoder.module.js",
  "vendor/RoomEnvironment.js",
  "vendor/body.glb",
  "manifest.webmanifest",
  "audio/clips.json",
  "audio/silence.mp3",
  "assets/photos/cat.jpg",
  "assets/photos/dog.jpg",
  "assets/photos/rabbit.jpg",
  "assets/photos/duck.jpg",
  "assets/photos/elephant.jpg",
  "assets/photos/tiger.jpg",
  "assets/photos/butterfly.jpg",
  "assets/photos/horse.jpg",
  "assets/photos/sunflower.jpg",
  "assets/photos/rose.jpg",
  "assets/photos/tulip.jpg",
  "assets/photos/daisy.jpg",
  "assets/photos/car.jpg",
  "assets/photos/airplane.jpg",
  "assets/photos/helicopter.jpg",
  "assets/photos/truck.jpg",
  "assets/illustrations/lion.svg",
  "assets/illustrations/giraffe.svg",
  "assets/illustrations/zebra.svg",
  "assets/illustrations/panda.svg",
  "assets/illustrations/koala.svg",
  "assets/illustrations/fox.svg",
  "assets/illustrations/bear.svg",
  "assets/illustrations/monkey.svg",
  "assets/illustrations/frog.svg",
  "assets/illustrations/turtle.svg",
  "assets/illustrations/owl.svg",
  "assets/illustrations/penguin.svg",
  "assets/illustrations/tree.svg",
  "assets/illustrations/cactus.svg",
  "assets/illustrations/mushroom.svg",
  "assets/illustrations/rainbow.svg",
  "assets/illustrations/cloud.svg",
  "assets/illustrations/sun.svg",
  "assets/illustrations/moon.svg",
  "assets/illustrations/star.svg",
  "assets/illustrations/leaf.svg",
  "assets/illustrations/snowflake.svg",
  "assets/illustrations/volcano.svg",
  "assets/illustrations/ocean.svg",
  "assets/illustrations/bicycle.svg",
  "assets/illustrations/bus.svg",
  "assets/illustrations/train.svg",
  "assets/illustrations/rocket.svg",
  "assets/illustrations/taxi.svg",
  "assets/illustrations/sailboat.svg",
  "assets/illustrations/ship.svg",
  "assets/illustrations/fire_engine.svg",
  "assets/illustrations/police_car.svg",
  "assets/illustrations/tractor.svg",
  "assets/illustrations/scooter.svg",
  "assets/illustrations/ambulance.svg",
  "assets/illustrations/apple.svg",
  "assets/illustrations/banana.svg",
  "assets/illustrations/grapes.svg",
  "assets/illustrations/orange.svg",
  "assets/illustrations/strawberry.svg",
  "assets/illustrations/pineapple.svg",
  "assets/illustrations/watermelon.svg",
  "assets/illustrations/cherries.svg",
  "assets/illustrations/peach.svg",
  "assets/illustrations/lemon.svg",
  "assets/illustrations/pear.svg",
  "assets/illustrations/carrot.svg",
  "assets/illustrations/books.svg",
  "assets/illustrations/pencil.svg",
  "assets/illustrations/scissors.svg",
  "assets/illustrations/backpack.svg",
  "assets/illustrations/clock.svg",
  "assets/illustrations/key.svg",
  "assets/illustrations/umbrella.svg",
  "assets/illustrations/balloon.svg",
  "assets/illustrations/kite.svg",
  "assets/illustrations/gift.svg",
  "assets/illustrations/toothbrush.svg",
  "assets/illustrations/soccer_ball.svg",
  "assets/illustrations/mountain.svg",
  "assets/illustrations/tent.svg",
  "assets/illustrations/house.svg",
  "assets/illustrations/school.svg",
  "assets/illustrations/hospital.svg",
  "assets/illustrations/slide.svg",
  "assets/illustrations/bridge.svg",
  "assets/illustrations/castle.svg",
  "assets/illustrations/globe.svg",
  "assets/illustrations/map.svg",
  "assets/illustrations/compass.svg",
  "assets/illustrations/camera.svg",
  "assets/illustrations/microscope.svg",
  "assets/illustrations/telescope.svg",
  "assets/illustrations/magnet.svg",
  "assets/illustrations/robot.svg",
  "assets/illustrations/lightbulb.svg",
  "assets/illustrations/battery.svg",
  "assets/illustrations/gear.svg",
  "assets/illustrations/test_tube.svg",
  "assets/illustrations/dna.svg",
  "assets/illustrations/atom.svg",
  "assets/illustrations/satellite.svg",
  "assets/illustrations/comet.svg",
  "assets/illustrations/ATTRIBUTION.md",
  "data/content.json",
  "data/thinking.json",
  "data/science.json",
  "data/grammar.json",
  "data/grade1.json",
  "data/words.json",
  "data/stories.json",
  "data/early-words.json",
  "data/reading-patterns.json",
  "data/country.json",
  "assets/currencies/us-1.svg",
  "assets/currencies/us-5.svg",
  "assets/currencies/us-10.svg",
  "assets/currencies/us-25.svg",
  "assets/currencies/us-note-100.svg",
  "assets/currencies/us-note-500.svg",
  "assets/currencies/us-note-1000.svg",
  "assets/currencies/us-note-2000.svg",
  "assets/currencies/uk-1.svg",
  "assets/currencies/uk-2.svg",
  "assets/currencies/uk-5.svg",
  "assets/currencies/uk-10.svg",
  "assets/currencies/uk-20.svg",
  "assets/currencies/uk-50.svg",
  "assets/currencies/uk-100.svg",
  "assets/currencies/uk-200.svg",
  "assets/currencies/uk-note-500.svg",
  "assets/currencies/uk-note-1000.svg",
  "assets/currencies/uk-note-2000.svg",
  "assets/currencies/uk-note-5000.svg",
  "assets/currencies/ca-5.svg",
  "assets/currencies/ca-10.svg",
  "assets/currencies/ca-25.svg",
  "assets/currencies/ca-100.svg",
  "assets/currencies/ca-200.svg",
  "assets/currencies/ca-note-500.svg",
  "assets/currencies/ca-note-1000.svg",
  "assets/currencies/ca-note-2000.svg",
  "assets/currencies/ca-note-5000.svg",
  "assets/currencies/au-5.svg",
  "assets/currencies/au-10.svg",
  "assets/currencies/au-20.svg",
  "assets/currencies/au-50.svg",
  "assets/currencies/au-100.svg",
  "assets/currencies/au-200.svg",
  "assets/currencies/au-note-500.svg",
  "assets/currencies/au-note-1000.svg",
  "assets/currencies/au-note-2000.svg",
  "assets/currencies/au-note-5000.svg",
  "assets/currencies/nz-10.svg",
  "assets/currencies/nz-20.svg",
  "assets/currencies/nz-50.svg",
  "assets/currencies/nz-100.svg",
  "assets/currencies/nz-200.svg",
  "assets/currencies/nz-note-500.svg",
  "assets/currencies/nz-note-1000.svg",
  "assets/currencies/nz-note-2000.svg",
  "assets/currencies/nz-note-5000.svg",
  "assets/currencies/in-100.svg",
  "assets/currencies/in-200.svg",
  "assets/currencies/in-500.svg",
  "assets/currencies/in-1000.svg",
  "assets/currencies/in-2000.svg",
  "assets/currencies/in-note-1000.svg",
  "assets/currencies/in-note-2000.svg",
  "assets/currencies/in-note-10000.svg",
  "assets/currencies/in-note-5000.svg",
  "assets/currencies/ie-1.svg",
  "assets/currencies/ie-2.svg",
  "assets/currencies/ie-5.svg",
  "assets/currencies/ie-10.svg",
  "assets/currencies/ie-20.svg",
  "assets/currencies/ie-50.svg",
  "assets/currencies/ie-100.svg",
  "assets/currencies/ie-200.svg",
  "assets/currencies/ie-note-500.svg",
  "assets/currencies/ie-note-1000.svg",
  "assets/currencies/ie-note-2000.svg",
  "assets/currencies/ie-note-5000.svg",
  "assets/games/mole.svg",
  "assets/games/mouse.svg",
  "assets/games/hedgehog.svg",
  "assets/games/flower.svg",
  "assets/games/meadow.svg",
  "data/grade1words.json",
  "data/phonics.json",
  "data/scenes.json",
  "data/landmarks.json",
  "data/coloring-0.json",
  "data/coloring-1.json",
  "data/coloring-2.json",
  "data/coloring-3.json",
  "data/coloring-4.json",
  "data/coloring-5.json",
  "data/coloring-landmarks.json",
  "data/landmark-drawings.json",
  "assets/landmarks/liberty.svg",
  "assets/landmarks/eiffel.svg",
  "assets/landmarks/pyramid.svg",
  "assets/landmarks/tajmahal.svg",
  "assets/landmarks/cntower.svg",
  "assets/landmarks/niagara.svg",
  "assets/landmarks/greatwall.svg",
  "assets/landmarks/bigben.svg",
  "assets/landmarks/opera.svg",
  "assets/landmarks/fuji.svg",
  "assets/landmarks/colosseum.svg",
  "assets/landmarks/christ.svg",
  "assets/landmarks/goldengate.svg",
  "assets/landmarks/machupicchu.svg",
  "assets/landmarks/pisa.svg",
  "assets/landmarks/stbasil.svg",
  "assets/landmarks/brandenburg.svg",
  "assets/landmarks/tokyo.svg",
  "assets/landmarks/amazon.svg",
  "assets/landmarks/grandcanyon.svg",
  "assets/landmarks/uluru.svg",
  "assets/landmarks/reef.svg",
  "assets/landmarks/parthenon.svg",
  "assets/landmarks/neuschwanstein.svg",
  "assets/landmarks/venice.svg",
  "assets/landmarks/chichen.svg",
  "assets/landmarks/sphinx.svg",
  "assets/landmarks/himeji.svg",
  "assets/landmarks/forbidden.svg",
  "assets/landmarks/hagia.svg",
  "assets/landmarks/cappadocia.svg",
  "assets/landmarks/sagrada.svg",
  "assets/landmarks/stonehenge.svg",
  "assets/landmarks/towerbridge.svg",
  "assets/landmarks/safari.svg",
  "assets/landmarks/tablemtn.svg",
  "assets/landmarks/borobudur.svg",
  "assets/landmarks/milford.svg",
  "assets/landmarks/iguazu.svg",
  "data/game-themes.json",
  "assets/maze/duckling.svg",
  "assets/maze/child.svg",
  "assets/maze/bone.svg",
  "assets/maze/bee.svg",
  "assets/maze/cheese.svg",
  "assets/maze/parking.svg",
  "data/visuals.json",
  "data/geo.json",
  "data/workbook.json",
  "data/trace.json",
  "assets/workbook/savanna.svg",
  "assets/workbook/garden.svg",
  "assets/workbook/room.svg",
  "assets/workbook/square-room.svg",
  "assets/workbook/forest.svg",
  "assets/workbook/sports.svg",
  "assets/workbook/park.svg",
  "assets/workbook/cafe.svg",
  "icons/icon-180.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "data/upper-grade-stories.json",
  "data/landmark-photos.json",
  "assets/body/child-front.webp",
];
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
