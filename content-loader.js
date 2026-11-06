/* Offline-first bootstrap: data is JSON, scripts contain only rendering/game logic.
   Bundled JSON must be loaded BEFORE question generators run. No eval or remote scripts. */
(() => {
  'use strict';
  const NAMESPACES = ['curriculum-map','language23','world23','drawings','grade23-extension','geo', 'workbook', 'trace', 'content', 'thinking', 'science', 'grammar', 'grade1', 'grade1words', 'phonics', 'words', 'stories', 'early-words', 'reading-patterns', 'landmark-photos', 'landmark-online-previews', 'upper-grade-stories', 'explorer-math', 'explorer-science', 'country', 'visuals', 'game-themes', 'scenes', 'landmarks', 'coloring-0', 'coloring-1', 'coloring-2', 'coloring-3', 'coloring-4', 'coloring-5', 'coloring-landmarks'];
  const SCRIPTS = [
    'feature-flags.js','storage.js','geo.js','art-engine.js','landmark-engine.js',
    'story-engine.js','words.js','phonics.js','early-words.js','grade1words.js',
    'photos.js','illustrations.js','content.js','content-packs.js',
    'thinking.js','country.js','levels.js','gradefit.js','science.js','grammar.js','numsense.js','math23.js',
    'grade1.js','language23.js','world23.js','editions.js','variants.js','build.js','explorer-engine.js','app.js','scene-engine.js','games.js','pathmaze.js',
    'radialmaze.js','wordgames.js','trace.js','progress.js','onboarding.js','library.js','workbook.js','fluent.js'
  ];
  const status = document.getElementById('loadStatus');
  const play = document.getElementById('startBtn');
  window.KidsLearnReady = (async () => {
    const data = new Map();
    await Promise.all(NAMESPACES.map(async (name) => {
      const response = await fetch('data/' + name + '.json');
      if (!response.ok) throw Error('Missing offline data: ' + name);
      const payload = await response.json();
      if (payload.schema !== 1 || payload.namespace !== name ||
          !payload.datasets || Array.isArray(payload.datasets) ||
          typeof payload.datasets !== 'object') throw Error('Invalid offline data: ' + name);
      data.set(name, payload.datasets);
    }));
    window.ContentData = Object.freeze({
      get(namespace, key) {
        const values = data.get(namespace);
        if (!values || !Object.prototype.hasOwnProperty.call(values, key)) {
          throw new Error('Required bundled content is missing: ' + namespace + '/' + key);
        }
        return values[key];
      },
      namespaces: () => [...data.keys()]
    });
    // Fetch bundled engines in parallel while executing classic scripts in order.
    // async=false on dynamically inserted scripts retains dependency ordering.
    await Promise.all(SCRIPTS.map(path => new Promise((resolve, reject) => {
      const el = document.createElement('script');
      el.src = path;
      el.async = false;
      el.onload = resolve;
      el.onerror = () => reject(new Error('Could not load ' + path));
      document.body.appendChild(el);
    })));
    if (status) status.textContent = '';
    if (play) play.disabled = false;
    return true;
  })().catch(err => {
    console.error('Kids-Learn could not load required offline content', err);
    if (status) status.textContent = 'Could not open learning content. Reconnect once and try again.';
    if (play) { play.disabled = true; }
    throw err;
  });
})();

// Hold the module's load lifecycle until all local JSON and classic engines are ready.
await window.KidsLearnReady;
