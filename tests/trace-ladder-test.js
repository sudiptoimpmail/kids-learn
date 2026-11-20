// Tracing grows with the child: her own name first (Pre-K and K), words for every grade, capital and small letters
// shown together, numbers that open ten at a time up to 100 (K) and 120 (1st+), and a guide that fades with practice.
const assert = require('node:assert/strict'), { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN });
  try {
    const p = await b.newPage({ viewport: { width: 1180, height: 820 } }); const errors = [];
    p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => { if (/Missing natural recording/.test(m.text())) errors.push(m.text()); });
    await p.goto('http://localhost:8765/'); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
    await p.evaluate(() => { document.getElementById('splash').style.display = 'none'; state.voice = true; });
    // ---- her name: Pre-K and K open on it; first letter alone, then the whole name with a capital first letter
    const named = await p.evaluate(() => { state.name = 'maya r.'; state.grade = 'prek'; state.traced = {}; TR.picked = false; TR.set = 'big'; openTrace();
      const tab = document.querySelector('#trace .tr-tab[data-set="name"]');
      return { set: TR.set, items: traceItems('name').map((x) => x[0]), tab: !tab.hidden && tab.textContent.includes('Maya'), spoken: traceItems('name').map((x) => x[2]) }; });
    assert.deepEqual({ set: named.set, items: named.items, tab: named.tab }, { set: 'name', items: ['M', 'Maya'], tab: true });
    assert.equal(await p.evaluate(() => CoreVoice.canSay(traceItems('name').flatMap((x) => x[2].split('. ')))), true, 'name lines are recorded');
    assert.equal(await p.evaluate(() => { state.grade = 'g2'; TR.picked = false; TR.set = 'big'; openTrace(); return TR.set; }), 'big', '2nd grade does not start on the name');
    assert.equal(await p.evaluate(() => { state.name = ''; state.grade = 'k'; TR.picked = false; TR.set = 'name'; openTrace(); return [TR.set, document.querySelector('#trace .tr-tab[data-set="name"]').hidden].join(); }), 'big,true', 'no name, no name tab');
    // ---- words for every grade, all recorded (word, then its letters)
    const words = await p.evaluate(() => Object.fromEntries(['prek', 'k', 'g1', 'g3'].map((g) => { state.grade = g; const it = traceItems('words'); return [g, { n: it.length, first: it[0][0], said: it.every((x) => CoreVoice.canSay(x[2].split('. '))), tab: (openTrace(), !document.querySelector('#trace .tr-tab[data-set="words"]').hidden) }]; })));
    for (const g of ['prek', 'k', 'g1', 'g3']) assert.ok(words[g].n >= 12 && words[g].said && words[g].tab, `${g} words: ${JSON.stringify(words[g])}`);
    assert.ok(words.prek.first.length <= 3 && words.prek.first !== words.g1.first, 'Pre-K starts with short words');
    // ---- capital and small letters side by side
    assert.equal(await p.evaluate(() => { TR.set = 'small'; TR.i = 6; renderTrace(false); return document.querySelector('.tr-pair').textContent; }), 'Gg');
    // ---- numbers open ten at a time, up to the grade's top; 21+ show tens and ones; all recorded
    const nums = await p.evaluate(() => { const top = (g, done) => { state.grade = g; state.traced = {}; for (let n = 1; n <= done; n++) state.traced['num' + n] = 1; return traceItems('num').length; };
      const out = { prek: [top('prek', 0), top('prek', 20)], k: [top('k', 0), top('k', 17), top('k', 18), top('k', 28), top('k', 100)], g1: [top('g1', 0), top('g1', 120)], g3: top('g3', 0) };
      state.grade = 'g1'; state.traced = {}; const all = Array.from({ length: 120 }, (_, i) => i + 1); for (const n of all) state.traced['num' + n] = 1;
      const items = traceItems('num'); out.said = items.every((x) => CoreVoice.canSay(x[2].split('. ').filter(Boolean))); out.n34 = items[33][1]; out.blocks = (items[33][3].match(/class="ten"/g) || []).length + '/' + (items[33][3].match(/class="one"/g) || []).length; return out; });
    assert.deepEqual(nums, { prek: [20, 20], k: [20, 20, 30, 40, 100], g1: [50, 120], g3: 100, said: true, n34: '34 = 3 tens and 4 ones', blocks: '3/4' });
    assert.equal(await p.evaluate(() => { state.grade = 'k'; state.traced = {}; TR.set = 'num'; TR.i = 0; renderTrace(false); return document.querySelector('#trStrip .tr-lock').textContent.trim(); }), '🔒 21+');
    // ---- the guide fades with practice, and tracing counts up
    const fade = await p.evaluate(() => { const st = [0, 1, 2, 3, 4, 9].map((c) => guideStage('big', 'A') || (state.traced.bigA = c, guideStage('big', 'A'))); return st; });
    const stages = await p.evaluate(() => [0, 1, 2, 3, 4, 9].map((c) => { state.traced = { bigA: c }; return guideStage('big', 'A'); }));
    assert.deepEqual(stages, [0, 0, 1, 1, 2, 2]);
    const traced = await p.evaluate(async () => { state.grade = 'k'; state.name = 'Maya'; state.voice = false; state.traced = {}; TR.set = 'name'; TR.i = 1; renderTrace(false);
      const W = document.getElementById('trGuide').clientWidth, sk = window.__trace.skelPts(), left = sk.slice(), strokes = []; let cur = [left.shift()]; strokes.push(cur);
      while (left.length) { const l = cur[cur.length - 1]; let bi = 0, bd = 1e9; left.forEach((q, i) => { const d = Math.hypot(q[0] - l[0], q[1] - l[1]); if (d < bd) { bd = d; bi = i; } }); const q = left.splice(bi, 1)[0]; if (bd > W * 0.06) { cur = [q]; strokes.push(cur); } else cur.push(q); }
      const stageBefore = document.querySelector('.tr-stage').dataset.stage; window.__trace.strokesSet(strokes); const once = state.traced.nameMaya;
      state.traced.nameMaya = 4; renderTrace(false); return { stageBefore, once, stageAfter: document.querySelector('.tr-stage').dataset.stage }; });
    assert.deepEqual(traced, { stageBefore: '0', once: 1, stageAfter: '2' });
    // ---- a tab starts on the item practised least
    assert.equal(await p.evaluate(() => { state.traced = { bigA: 3, bigB: 1 }; document.querySelector('#trace .tr-tab[data-set="big"]').click(); return traceItems('big')[TR.i][0]; }), 'C');
    assert.deepEqual(errors, []);
    console.log('PASS tracing ladder: name first for Pre-K/K, words every grade, Aa pairs, numbers by tens to 100/120, guide fades with practice');
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
