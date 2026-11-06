// Build-it cards: each kind can be built by tapping and checked; a wrong check counts as a try;
// a right build finishes the card. Also: 1st–3rd grade home shows a recommended row with the rest under Explore.
//   node tests/build-test.js [--shots dir]
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const SHOTS = (() => { const i = process.argv.indexOf('--shots'); return i > 0 ? process.argv[i + 1] : ''; })();
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 820, height: 1180 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html?explore=closed'); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
  await p.locator('#startBtn').click(); await p.waitForTimeout(300);
  const cases = [['prek', 'add', 1, 'tf'], ['g1', 'numsense', 2, 'pv'], ['g3', 'numsense', 4, 'pv'], ['g3', 'mul', 4, 'ar'], ['g2', 'frac', 2, 'fr'], ['g3', 'frac', 4, 'fr'], ['g2', 'clock', 3, 'ck']];
  for (const [g, id, lv, kind] of cases) {
    const ok = await p.evaluate(([g, id, lv, kind]) => {
      Object.assign(state, { grade: g, showAll: false, testMode: false, voice: false, levels: { [id]: lv }, recent: {}, recentContent: {} });
      for (let i = 0; i < 60; i++) { startRound(id, 10); const k = R.qs.findIndex((q) => q.key.startsWith('bld-' + kind)); if (k >= 0) { R.i = k; renderQ(); return R.qs[k].key; } document.querySelector('#quitBtn').click(); }
      return null;
    }, [g, id, lv, kind]);
    assert.ok(ok, `${g} ${id}: no build card`);
    // a wrong check first
    await p.locator('.bld-check').click(); await p.waitForTimeout(100);
    assert.equal(await p.evaluate(() => R.qs[R.i].tries), 1, `${ok}: a wrong check did not count as a try`);
    // now build it right, by tapping like a child
    const B = await p.evaluate(() => R.qs[R.i].build);
    const tap = async (sel, n = 1) => { for (let i = 0; i < n; i++) await p.locator(sel).first().click(); };
    if (B.kind === 'tenframe') await tap(`.tf-cell[data-i="${B.target - 1}"]`);
    if (B.kind === 'place') { const h = Math.floor(B.target / 100), t = Math.floor(B.target / 10) % 10, o = B.target % 10; await tap('[data-a="h+"]', h); await tap('[data-a="t+"]', t); await tap('[data-a="o+"]', o); }
    if (B.kind === 'array') { await tap('[data-a="r+"]', B.rows - 1); await tap('[data-a="c+"]', B.cols - 1); }
    if (B.kind === 'fraction') for (let i = 0; i < B.a; i++) await p.locator(`.fr-part[data-i="${i}"]`).click();
    if (B.kind === 'clock') { const hs = (B.h - 12 + 12) % 12; await tap('[data-a="ch+"]', hs); await tap('[data-a="cm+"]', B.m / B.step); }
    if (SHOTS) await p.screenshot({ path: `${SHOTS}/${g}-${B.kind}.png` });
    await p.locator('.bld-check').click(); await p.waitForTimeout(200);
    const done = await p.evaluate(() => ({ locked: R.locked, tries: R.qs[R.i].tries }));
    assert.ok(done.locked, `${ok}: the right build was not accepted`);
    await p.evaluate(() => document.querySelector('#quitBtn').click());
  }
  // home: 1st–3rd grade fold the catalog behind Explore; Pre-K does not
  const home = await p.evaluate(() => {
    const look = (g) => { state.grade = g; state.exploreOpen = null; renderHome(); const d = document.querySelector('#grid .explore');
      return { rec: document.querySelectorAll('#grid .rec-section .tile').length, fold: !!d, open: d ? d.open : null }; };
    return { prek: look('prek'), g2: look('g2') };
  });
  assert.deepEqual(home.prek, { rec: 0, fold: false, open: null });
  assert.ok(home.g2.fold && home.g2.open === false && home.g2.rec >= 3 && home.g2.rec <= 6, JSON.stringify(home.g2));
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/home-g2.png` });
  assert.deepEqual(errs, []);
  console.log('PASS build-it cards (ten frame, place value, array, fraction, clock) and recommended-first home for 1st–3rd grade');
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
