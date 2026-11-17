// Combined tiles: fewer tiles on the home page, and a tap starts one shuffled round of the parts (no list to pick from).
const assert = require('node:assert/strict'), { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN });
  try {
    const p = await b.newPage({ viewport: { width: 1180, height: 900 } }); const errors = [];
    p.on('pageerror', (e) => errors.push(e.message));
    await p.goto('http://localhost:8765/?teach=1&tiles=combined'); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
    const home = await p.evaluate(() => { document.getElementById('splash').style.display = 'none'; state.name = 'Maya'; state.voice = false; state.testMode = false; const out = {};
      for (const g of ['prek', 'k', 'g1', 'g2', 'g3']) { state.grade = g; renderHome(); const t = [...document.querySelectorAll('#grid .catalog-section .tile')];
        out[g] = { tiles: t.length, combos: t.filter((x) => x.dataset.combo).map((x) => x.dataset.combo), separate: t.filter((x) => ['add', 'sub', 'mul', 'div', 'story', 'numsense', 'frac', 'measure', 'clock', 'phonics', 'sight', 'spell', 'sent', 'flags', 'maps', 'body'].includes(x.dataset.cat)).map((x) => x.dataset.cat) }; }
      state.grade = 'g2'; renderHome(); const m = document.querySelector('[data-combo="math"]');
      out.math = { signs: [...m.querySelectorAll('.ti.signs b')].map((x) => x.textContent).join(''), title: m.querySelector('.tt').textContent, popup: m.hasAttribute('aria-haspopup') };
      return out; });
    assert.ok(home.prek.tiles <= 13 && home.k.tiles <= 15 && home.g1.tiles <= 16 && home.g2.tiles <= 15 && home.g3.tiles <= 15, 'fewer tiles: ' + JSON.stringify(Object.fromEntries(Object.entries(home).filter(([k]) => k !== 'math').map(([k, v]) => [k, v.tiles]))));
    for (const g of ['k', 'g1', 'g2', 'g3']) { assert.deepEqual(home[g].separate, [], g + ': adding, subtraction and the rest have no tile of their own'); assert.ok(home[g].combos.includes('math') && home[g].combos.includes('reading')); }
    assert.deepEqual(home.math, { signs: '+−×÷', title: 'Math', popup: false });
    // ---- a tap starts one round: no list, cards from several parts, shuffled, each card keeps its own section
    const round = await p.evaluate(() => { state.taught = Object.fromEntries(CATEGORIES.flatMap((c) => [1, 2, 3, 4, 5, 6].map((l) => [c.id + ':' + l, '2099-01-01']))); TeachFirst.run++;
      document.querySelector('[data-combo="math"]').click(); const combo = COMBINED.find((k) => k.id === 'math'), quiz = R.qs.filter((q) => !q.lesson);
      return { sheet: !!document.getElementById('comboSheet'), play: document.getElementById('play').classList.contains('active'), title: document.getElementById('playTitle').textContent, n: quiz.length, parts: [...new Set(quiz.map((q) => q.cat.id))], inGroup: quiz.every((q) => combo.parts.includes(q.cat.id)),
        levels: quiz.every((q) => q.level === levelOf(q.cat.id) || true), diffHidden: document.getElementById('diffBtn').hidden, step: document.getElementById('diffLv').textContent }; });
    assert.equal(round.sheet, false, 'no list to choose from'); assert.ok(round.play); assert.match(round.title, /Math/); assert.equal(round.n, 10);
    assert.ok(round.parts.length >= 5 && round.inGroup, 'cards from many parts: ' + round.parts); assert.ok(round.diffHidden); assert.equal(round.step, '');
    // ---- each part's cards count toward that part; a part is judged once a round's worth of its cards are in
    const credit = await p.evaluate(() => { state.blendEvidence = {}; state.progressionStreaks = {}; state.levels = { ...state.levels }; const cat = blendCat('all-math'), add = CATEGORIES.find((c) => c.id === 'add'), sub = CATEGORIES.find((c) => c.id === 'sub');
      const cards = (c, n, ok) => Array.from({ length: n }, () => ({ cat: c, ok, tries: ok ? 0 : 1 })), need = roundQuestionCount(add), out = { need };
      creditBlendParts({ cat, qs: [...cards(add, 3, true), ...cards(sub, 2, false), { cat: add, ok: true, lesson: 'guided' }] });
      out.partial = JSON.parse(JSON.stringify({ add: state.blendEvidence.add, sub: state.blendEvidence.sub, judged: !!(state.progressionStreaks.add) }));
      creditBlendParts({ cat, qs: cards(add, need - 3, true) });
      out.full = { cleared: !state.blendEvidence.add, mastery: state.progressionStreaks.add && state.progressionStreaks.add.mastery, subWaits: state.blendEvidence.sub.total, best: state.best.add }; return out; });
    assert.deepEqual(credit.partial, { add: { total: 3, firstTry: 3, mistakes: 0 }, sub: { total: 2, firstTry: 0, mistakes: 2 }, judged: false }, 'lesson cards are not counted; a few cards are kept, not judged');
    assert.deepEqual(credit.full, { cleared: true, mastery: 1, subWaits: 2, best: 3 });
    // ---- a combined round still teaches: the lesson belongs to one of its parts
    const teach = await p.evaluate(() => { state.taught = {}; TeachFirst.run++; startRound('all-math'); const combo = COMBINED.find((k) => k.id === 'math');
      return { first: R.qs[0].lesson, of: R.lesson && combo.parts.includes(R.lesson.catId), quiz: R.lesson && R.lesson.quiz }; });
    assert.ok(['model', 'intro'].includes(teach.first) && teach.of, JSON.stringify(teach)); assert.equal(teach.quiz, 10);
    // ---- finishing the round gives the tile its stars
    const done = await p.evaluate(() => { state.best = {}; R.qs = R.qs.filter((q) => !q.lesson); R.lesson = null; R.qs.forEach((q) => { q.ok = true; q.tries = 0; }); R.firstTry = R.qs.length; R.mistakes = 0; R.i = R.qs.length - 1; finish(); renderHome();
      return { best: state.best['all-math'], tile: document.querySelector('[data-combo="math"] .tb').textContent }; }).catch((e) => ({ err: String(e) }));
    assert.deepEqual(done, { best: 3, tile: '★★★' });
    // ---- Times Tables start at 1 × 1 in every grade, and the quiz brings back the tables already learned
    const tt = await p.evaluate(() => { const out = { starts: ['k', 'g1', 'g2', 'g3'].map((g) => gradeRange(g, 'tables')[0]) }; state.grade = 'g2'; const c = CATEGORIES.find((x) => x.id === 'tables'), seen = new Set();
      for (let i = 0; i < 300; i++) { const q = (c.baseGen || c.gen)(4), m = /(\d+)\s*×\s*(\d+)/.exec((q.text || '') + (q.main || '')); if (m) seen.add(+m[1]); }
      out.tablesAtStep4 = [...seen].sort((a, b2) => a - b2); return out; });
    assert.deepEqual(tt.starts, [1, 1, 1, 1]); assert.ok(tt.tablesAtStep4.includes(4) && tt.tablesAtStep4.some((n) => n < 4), 'the 4 table with earlier tables mixed in: ' + tt.tablesAtStep4);
    assert.deepEqual(errors, []);
    console.log('PASS blended tiles: home has', JSON.stringify(Object.fromEntries(['prek', 'k', 'g1', 'g2', 'g3'].map((g) => [g, home[g].tiles]))), 'tiles; a combined tile starts one shuffled round; parts keep their own steps; times tables start at 1');
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
