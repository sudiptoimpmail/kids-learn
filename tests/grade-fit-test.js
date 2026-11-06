// Grade fit: every section a grade sees, at every level of that grade, deals only cards a child that age can do.
// Pre-K can't read or spell words; K reads short words only; 3rd grade never gets 1st-grade card types or × 1 drills.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 820, height: 1180 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
  await p.locator('#startBtn').click(); await p.waitForTimeout(400);
  const r = await p.evaluate(() => {
    const res = { sections: {}, cards: {} };
    for (const g of ['prek', 'k', 'g1', 'g2', 'g3']) {
      Object.assign(state, { grade: g, testMode: false, showAll: false, country: 'us', levels: {}, recent: {} });
      res.sections[g] = visibleGames().filter((c) => c.gen && c.id !== 'mix').map((c) => c.id);
      res.cards[g] = [];
      for (const id of res.sections[g]) {
        const [lo, hi] = gradeRange(g, id) || [1, 1];
        for (let lv = lo; lv <= hi; lv++) {
          state.levels[id] = lv;
          for (let k = 0; k < 3; k++) {
            startRound(id, 10);
            for (const q of R.qs) res.cards[g].push({ id, key: String(q.key || ''), spell: !!q.spell, fill: !!(q.fillIn || q.passageFill), order: !!q.order,
              words: (q.options || []).filter((o) => readOnlyChoice(o, 1)).map((o) => fitText(o.html != null ? o.html : o.v).trim()) });
            try { document.querySelector('#quitBtn').click(); } catch {}
          }
        }
      }
    }
    // an older profile: harder levels switched on and every section saved at its top level
    res.older = {};
    for (const g of ['prek', 'k']) {
      Object.assign(state, { grade: g, showAll: true, levels: {}, recent: {}, recentContent: {} });
      for (const c of CATEGORIES) state.levels[c.id] = maxLevelOf(c.id);
      res.older[g] = visibleGames().filter((c) => c.gen && c.id !== 'mix').map((c) => {
        R = null; startRound(c.id, 10);
        const out = { id: c.id, n: R ? R.qs.length : 0, top: gradeRange(g, c.id)[1], max: R ? Math.max(...R.qs.map((q) => q.level)) : 0,
          bad: R ? R.qs.filter((q) => !gradeFits(q, g, c.id)).length : 0, subs: [...document.querySelectorAll('#grid .tile[data-cat="add"] .ts')].map((e) => e.textContent).join('') };
        try { document.querySelector('#quitBtn').click(); } catch {}
        return out;
      });
    }
    state.showAll = false;
    return res;
  });
  assert.deepEqual(errs, []);
  // 1. sections first: reading/spelling sections are not on a pre-reader's home screen
  for (const id of ['cvc', 'sight', 'spell', 'w4', 'sent', 'words', 'gp', 'places', 'maps', 'flags']) assert.ok(!r.sections.prek.includes(id), `Pre-K sees ${id}`);
  for (const id of ['trace', 'syl', 'body', 'jobs']) assert.ok(!r.sections.g3.includes(id), `3rd grade sees ${id}`);
  // 2. then cards: what a child is asked to do inside each section
  const pk = r.cards.prek;
  assert.ok(pk.length > 300, 'Pre-K still gets full rounds');
  assert.deepEqual(pk.filter((c) => c.spell || c.fill || c.order).map((c) => c.key), [], 'Pre-K spelling / fill-in / ordering');
  assert.deepEqual(pk.filter((c) => c.words.length).map((c) => c.key + ' ' + c.words.join('|')).slice(0, 5), [], 'Pre-K word-only answers');
  assert.deepEqual(pk.filter((c) => /^(cmpp|cmp-)/.test(c.key)).map((c) => c.key), [], 'Pre-K < > = signs');
  const kWords = r.cards.k.filter((c) => !['cvc', 'sight', 'spell', 'sent', 'phonics', 'match', 'syl'].includes(c.id) && c.words.length);
  assert.deepEqual(kWords.map((c) => c.id + ' ' + c.key).slice(0, 5), [], 'K word-only answers outside reading sections');
  const g3 = r.cards.g3;
  assert.deepEqual(g3.filter((c) => /^(cmpp-|ns-(blocks|measure|data|eo|skip|ba|val2)-|gr-(noun|verb|pl|opp)-|visual-|s2-find-(circle|square|triangle|star|heart|oval|rectangle|diamond))/.test(c.key)).map((c) => c.key).slice(0, 5), [], '3rd grade gets younger card types');
  assert.deepEqual(g3.filter((c) => /^(mul|div)-(1-\d+|\d+-1)$/.test(c.key)).map((c) => c.key), [], '3rd grade × 1 / ÷ 1 drills');
  assert.ok(!r.cards.g1.some((c) => /^ns-r(10|100)-/.test(c.key)), '1st grade gets rounding');
  // older profiles: a tile never opens an empty round, Pre-K never leaves its band, K goes at most one step up
  for (const [g, rows] of Object.entries(r.older)) for (const x of rows) {
    assert.ok(x.n > 0, `${g} ${x.id}: empty round with harder levels on`);
    assert.equal(x.bad, 0, `${g} ${x.id}: card the child can't do`);
    assert.ok(x.max <= x.top + (g === 'prek' ? 0 : 1), `${g} ${x.id}: level ${x.max} above ${x.top}`);
  }
  const counts = Object.fromEntries(Object.entries(r.cards).map(([g, v]) => [g, v.length]));
  console.log('PASS grade fit', JSON.stringify(counts), 'sections', JSON.stringify(Object.fromEntries(Object.entries(r.sections).map(([g, v]) => [g, v.length]))));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
