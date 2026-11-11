// Sections that are not needed at start load on demand (app.config.json "lazy"); everything else works without them.
const assert = require('node:assert/strict'), fs = require('fs'), { chromium } = require('playwright');
const cfg = JSON.parse(fs.readFileSync('app.config.json', 'utf8'));
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN });
  try {
    const p = await b.newPage({ viewport: { width: 1080, height: 810 } }); const errors = [], fetched = [];
    p.on('pageerror', (e) => errors.push(e.message)); p.on('request', (r) => fetched.push(new URL(r.url()).pathname.replace(/^\//, '')));
    await p.goto('http://localhost:8765/?lazy=1'); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
    const lazyFiles = Object.values(cfg.lazy).flatMap((g) => [...g.scripts, ...(g.data || []).map((d) => 'data/' + d + '.json')]);
    assert.deepEqual(lazyFiles.filter((f) => fetched.includes(f)), [], 'lazy files were loaded at start');
    // Home, a round of every Kindergarten and 2nd grade activity, Settings, Progress and the Play Zone work without them
    const r = await p.evaluate(() => {
      document.getElementById('splash').style.display = 'none'; state.name = 'Maya'; state.taught = {}; state.voice = false; state.playAlways = true;
      const out = [];
      for (const g of ['k', 'g2']) {
        state.grade = g; renderHome(); show('home');
        for (const c of visibleGames().filter((c) => c.gen && c.id !== 'placement')) { startRound(c.id); out.push(c.id + ':' + (R && R.qs.length)); }
      }
      renderHome(); openSettings(); show('settings'); openDashboard('home'); renderStickers(); openPlayZone();
      return { rounds: out, loaded: CoreLazy.loaded('games'), tiles: document.querySelectorAll('#pzGrid [data-g], #playzone .tile, #playzone button').length };
    });
    assert.equal(r.loaded, false, 'nothing above needed the games');
    assert.ok(r.rounds.every((x) => !x.endsWith(':0') && !x.endsWith(':undefined')), r.rounds.join(' '));
    // opening a game loads the section once, then runs the game (with its hooks)
    await p.evaluate(() => openGame('memory'));
    assert.equal(await p.evaluate(() => [CoreLazy.loaded('games'), document.querySelector('.screen.active').id].join()), 'true,game');
    assert.ok(await p.evaluate(() => CoreHooks.list().find((h) => h.name === 'openGame').installed));
    for (const id of ['ttt', 'pop', 'path', 'draw', 'color']) await p.evaluate((id) => { stopGame(); return openGame(id); }, id);
    assert.deepEqual(errors, []);
    console.log(`PASS lazy sections: ${lazyFiles.length} files wait until a game opens; ${r.rounds.length} rounds, Settings, Progress and Play Zone work without them`);
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
