// Phase G: every game, for every grade that sees it — it opens, draws something, starts at a level inside
// the grade's band, survives a few seconds of play time, and leaves cleanly (no stray timers or errors).
//   node tests/games-audit.js [--shots tests/out/games]
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const SHOTS = arg('--shots', '');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 820, height: 1180 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
  await p.locator('#startBtn').click(); await p.waitForTimeout(400);
  if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
  const rows = [];
  for (const g of ['prek', 'k', 'g1', 'g2', 'g3']) {
    const ids = await p.evaluate((g) => { Object.assign(state, { grade: g, showAll: false, testMode: false, gameLv: {}, playAlways: true });
      return GAMES.filter((x) => !BRAIN_GAME_IDS.has(x.id) || brainVisible(x)).map((x) => x.id); }, g);
    for (const id of ids) {
      const before = errs.length;
      const r = await p.evaluate(({ g, id }) => {
        Object.assign(state, { grade: g, showAll: false, gameLv: {} });
        brainMode = BRAIN_GAME_IDS.has(id);
        openGame(id);
        const band = GAME_GRADES[id] && GAME_GRADES[id][g];
        return { level: GAME_MAX[id] || id === 'sudoku' ? GL(id) : null, band };
      }, { g, id });
      await p.waitForTimeout(1200);
      const view = await p.evaluate(() => {
        const area = document.querySelector('#gameArea'), rect = area.getBoundingClientRect();
        const drawn = area.querySelectorAll('canvas, svg, button, img, .g-cell, div').length;
        return { active: document.querySelector('#game').classList.contains('active'), drawn, w: Math.round(rect.width), h: Math.round(rect.height),
          overflowX: document.documentElement.scrollWidth > innerWidth + 1 };
      });
      if (SHOTS) await p.screenshot({ path: `${SHOTS}/${g}-${id}.png` });
      // leave: the back button, then a pause in which a leaked timer would throw or reopen something
      await p.evaluate(() => { document.querySelector('#gameBack').click(); });
      await p.waitForTimeout(500);
      const left = await p.evaluate(() => !document.querySelector('#game').classList.contains('active'));
      rows.push({ grade: g, id, ...r, ...view, left, errors: errs.slice(before) });
    }
  }
  await p.evaluate(() => { brainMode = false; });
  fs.mkdirSync('tests/out', { recursive: true });
  fs.writeFileSync('tests/out/games.json', JSON.stringify(rows, null, 1));
  for (const x of rows) {
    const where = `${x.grade} ${x.id}`;
    assert.ok(x.active, `${where}: game screen did not open`);
    assert.ok(x.drawn > 0 && x.h > 100, `${where}: nothing drawn`);
    assert.ok(!x.overflowX, `${where}: page scrolls sideways`);
    assert.ok(x.left, `${where}: back did not leave the game`);
    assert.deepEqual(x.errors, [], `${where}: page errors`);
    if (x.band && x.level != null) assert.ok(x.level >= x.band[0] && x.level <= x.band[1], `${where}: starts at level ${x.level}, band ${x.band}`);
  }
  const by = rows.reduce((m, x) => ((m[x.grade] = (m[x.grade] || 0) + 1), m), {});
  console.log('PASS games audit: every game opens, draws, starts inside its grade band and exits cleanly', JSON.stringify(by));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
