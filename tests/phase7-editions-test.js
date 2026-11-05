// Phase 7: "zed" outside North America and national check practice per country.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 820, height: 1180 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
  await p.locator('#startBtn').click(); await p.waitForTimeout(500);
  const r = await p.evaluate(() => {
    const out = { tiles: {}, bad: [] };
    const tilesFor = (cc, g, region) => { state.country = cc; state.region = region || ''; state.grade = g; state.testMode = false; state.showAll = false; renderHome();
      return [...document.querySelectorAll('#grid .tile[data-cat="check"]')].map((t) => t.querySelector('.tt').textContent); };
    out.tiles = { us3: tilesFor('us', 'g3'), us2: tilesFor('us', 'g2'), on3: tilesFor('ca', 'g3', 'Ontario'), bc3: tilesFor('ca', 'g3', 'British Columbia'),
      ukk: tilesFor('uk', 'k'), uk3: tilesFor('uk', 'g3'), au3: tilesFor('au', 'g3'), nz2: tilesFor('nz', 'g2'), in1: tilesFor('in', 'g1'), ie3: tilesFor('ie', 'g3') };
    const check = (q, tag) => { if (q.passageFill || !q.options || !q.options.length || q.match || q.puzzle || q.multi) return; const v = q.options.map((o) => String(o.v));
      if (!v.includes(String(q.answer)) || new Set(v).size !== v.length || v.length < 2) out.bad.push(tag + ' ' + q.key); };
    for (const [cc, g] of [['us', 'g3'], ['ca', 'g3'], ['uk', 'k'], ['uk', 'g3'], ['au', 'g3'], ['nz', 'g2'], ['nz', 'g3'], ['in', 'g1'], ['in', 'g2'], ['in', 'g3'], ['ie', 'g3']]) {
      state.country = cc; state.grade = g; for (let i = 0; i < 80; i++) check(genCheck(), cc + g);
    }
    state.country = 'uk'; state.grade = 'g3'; out.mtc = Array.from({ length: 30 }, () => genCheck()).every((q) => q.key.startsWith('chk-mtc') && q.answer <= 144 && q.main.includes('ed-timer'));
    state.country = 'uk'; out.zedUK = sayParts(['z says', 'z']); state.country = 'us'; out.zedUS = sayParts(['z says', 'z']);
    out.noLang = !CATEGORIES.some((c) => c.id === 'lang');
    return out;
  });
  assert.deepEqual(r.bad, []);
  const t = r.tiles;
  assert.deepEqual(t.us3, ['State Test Practice']); assert.deepEqual(t.us2, []);
  assert.deepEqual(t.on3, ['EQAO Practice']); assert.deepEqual(t.bc3, ['Grade 3 Test Practice']);
  assert.deepEqual(t.ukk, ['Phonics Check']); assert.deepEqual(t.uk3, ['Times Tables Check']);
  assert.deepEqual(t.au3, ['NAPLAN Practice']); assert.deepEqual(t.nz2, ['Reading & Maths Check']);
  assert.deepEqual(t.in1, ['NIPUN Check']); assert.deepEqual(t.ie3, ['Standardised Test Practice']);
  assert.ok(r.mtc, 'UK Year 4 times tables check: 12 × 12 with a 6-second bar');
  assert.deepEqual(r.zedUK, ['zed says', 'zed']); assert.deepEqual(r.zedUS, ['z says', 'z']);
  assert.ok(r.noLang, 'no Māori or Hindi word pack');
  assert.deepEqual(errs, []);
  await b.close();
  console.log('PASS zed voice and check practice for 7 countries');
})().catch((e) => { console.error(e); process.exit(1); });
