// Phase 2: Grade 2–3 math sections work for every country, level and card type.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 820, height: 1180 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
  await p.locator('#startBtn').click(); await p.waitForTimeout(400);
  const r = await p.evaluate(() => {
    const bad = [], kinds = new Set();
    const cats = { frac: [1, 4], measure: [1, 4], clock: [5, 6], mul: [6, 6], numsense: [3, 5] };
    for (const cc of ['us', 'ca', 'uk', 'au', 'nz', 'in', 'ie']) {
      state.country = cc;
      for (const [id, [lo, hi]] of Object.entries(cats)) {
        const c = CATEGORIES.find((x) => x.id === id);
        for (let lv = lo; lv <= hi; lv++) for (let i = 0; i < 150; i++) {
          let q; try { q = (c.baseGen || c.gen)(lv); } catch (e) { bad.push(`${cc} ${id} ${lv} ERR ${e.message}`); continue; }
          kinds.add(q.key.replace(/-[^-]*$/, '').split('-').slice(0, 2).join('-'));
          const vals = q.options.map((o) => String(o.v));
          if (!vals.includes(String(q.answer))) bad.push(`${cc} ${id} ${lv} no answer ${q.key}`);
          if (new Set(vals).size !== vals.length) bad.push(`${cc} ${id} ${lv} duplicate ${q.key} ${vals}`);
          if (vals.length < 2) bad.push(`${cc} ${id} ${lv} too few ${q.key}`);
          if (/NaN|undefined/.test(q.main + q.text + vals)) bad.push(`${cc} ${id} ${lv} NaN ${q.key}`);
        }
      }
    }
    state.country = 'us'; state.grade = 'g3'; state.testMode = false; renderHome();
    const tiles = [...document.querySelectorAll('#grid .tile[data-cat]')].map((t) => t.dataset.cat);
    state.country = 'uk'; const quarter = genFractions(1); state.country = 'us';
    return { bad: bad.slice(0, 15), n: bad.length, kinds: [...kinds].sort(), tiles };
  });
  assert.equal(r.n, 0, r.bad.join('\n'));
  assert.ok(r.tiles.includes('frac') && r.tiles.includes('measure'), '3rd grade shows Fractions and Measure & Graphs');
  for (const k of ['frac-equal', 'frac-word', 'frac-name', 'frac-pick', 'frac-line', 'frac-cmp', 'frac-eq', 'frac-whole', 'frac-set', 'ms-ruler', 'ms-longer', 'ms-pict', 'ms-area', 'ms-per', 'ms-bar', 'ms-change', 'ms-sbar', 'ms-arear', 'ms-units', 'clk-el', 'clk-24', 'mul6t', 'mul6x', 'mul6s', 'ns-roman'])
    assert.ok(r.kinds.some((x) => x.startsWith(k)), 'card type never appeared: ' + k);
  assert.deepEqual(errs, []);
  await b.close();
  console.log('PASS Grade 2–3 math: fractions, measure & graphs, minutes and elapsed time, 24-hour time, ×10s and 12×12, Roman numerals, making change in 7 countries');
})().catch((e) => { console.error(e); process.exit(1); });
