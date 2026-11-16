// Shapes as one learning sequence from the question bank: an animated lesson, matching with lines,
// one-answer and tap-all questions, and three shape games (Shape Match, Build a Picture, Shape Puzzle).
const assert = require('node:assert/strict'), { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN });
  try {
    const p = await b.newPage({ viewport: { width: 1180, height: 820 } }); const errors = [];
    p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => { if (/Missing natural recording/.test(m.text())) errors.push(m.text()); });
    await p.goto('http://localhost:8765/'); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
    // ---- the set: valid, every sentence recorded, every game and picture known to the app
    const set = await p.evaluate(() => { document.getElementById('splash').style.display = 'none'; state.name = 'Maya'; state.testMode = false; state.voice = true;
      const all = QuestionBank.questions({ section: 'shape2' }), kinds = {}, bad = [];
      for (const q of all) { kinds[q.interaction] = (kinds[q.interaction] || 0) + 1;
        try { const c = BankCards.card(q); if (!CoreVoice.canSay(c.say)) bad.push('not recorded: ' + q.id + ' prompt'); if (c.hint && c.hint.say && !CoreVoice.canSay(c.hint.say)) bad.push('not recorded: ' + q.id + ' hint'); if (q.explain && !CoreVoice.canSay(q.explain)) bad.push('not recorded: ' + q.id + ' explain'); }
        catch (e) { bad.push(q.id + ': ' + e.message); }
        if (q.interaction === 'activity' && q.activity.picture && !ShapePlay.PICTURES[q.activity.picture]) bad.push(q.id + ': no picture'); }
      const lessons = ['k', 'g1', 'g2'].map((g) => [2, 3].map((s) => QuestionBank.lesson('shape2', s, g)).filter(Boolean).map((l) => l.id)).flat();
      for (const g of [['k', 2], ['g1', 3]]) { const l = QuestionBank.lesson('shape2', g[1], g[0]); for (const line of l.lines) if (!CoreVoice.canSay(line.say)) bad.push('not recorded: ' + line.say); }
      if (!CoreVoice.canSay('Tap a shape to turn it.')) bad.push('not recorded: turn tip');
      return { kinds, bad, lessons: [...new Set(lessons)], builds: [...new Set(all.filter((q) => q.activity && q.activity.kind !== 'shape-match').map((q) => q.activity.picture))].sort(), core: CORE_VERSION }; });
    assert.equal(set.core, '1.12.0'); assert.deepEqual(set.bad.slice(0, 8), []);
    assert.ok(set.kinds.activity >= 20 && set.kinds.match >= 4 && set.kinds.choice >= 10 && set.kinds.multi >= 6, JSON.stringify(set.kinds));
    assert.deepEqual(set.builds, ['boat', 'butterfly', 'car', 'castle', 'house', 'robot', 'rocket', 'train', 'tree']); assert.equal(set.lessons.length, 2);
    // ---- the Shapes section mixes them in, at every grade that has it
    const mix = await p.evaluate(() => { const c = CATEGORIES.find((x) => x.id === 'shape2'), out = {};
      for (const [g, lv] of [['prek', 1], ['k', 2], ['g1', 3], ['g2', 4], ['g3', 4]]) { state.grade = g; const seen = new Set();
        for (let i = 0; i < 160; i++) { const q = c.gen(lv); seen.add(q.activity ? q.activity.kind : q.match ? 'lines' : q.multi && q.bank ? 'tap-all' : q.bank ? 'choice' : 'picture-card'); }
        out[g] = [...seen].sort(); }
      state.grade = 'k'; return { out, teach: !!c.teach(2), noTeach: c.teach(1) }; });
    assert.deepEqual(mix.out.prek, ['picture-card', 'shape-build', 'shape-match']);
    assert.deepEqual(mix.out.k, ['choice', 'lines', 'picture-card', 'shape-build', 'shape-match', 'tap-all']);
    for (const g of ['g1', 'g2']) assert.deepEqual(mix.out[g], ['choice', 'lines', 'picture-card', 'shape-build', 'shape-match', 'shape-puzzle', 'tap-all'], g);
    assert.ok(mix.teach && mix.noTeach == null);
    // ---- play each kind inside a real round
    const ask = (id) => p.evaluate((id) => { const c = CATEGORIES.find((x) => x.id === 'shape2'); state.grade = id.grade || 'g1'; TeachFirst.run++; startRound('shape2', 5, true);
      const q = BankCards.card(QuestionBank.question(id.q)); q.tries = 0; q.cat = R.cat; q.level = 2; R.qs[R.i] = q; R.locked = false; renderQ(); return { text: document.getElementById('qText').textContent }; }, id);
    const startOk = await p.evaluate(() => typeof startRound === 'function' && typeof renderQ === 'function');
    assert.ok(startOk, 'round helpers');
    // Shape Match: a wrong outline is a try and the shape goes back; the right one stays
    await ask({ q: 'geo.match-game.s1.1', grade: 'k' }); await p.waitForSelector('.sp-shape-match .sp-piece');
    const m = await p.evaluate(() => { const s = window.__shapePlay, q = R.qs[R.i], pc = s.pieces()[0], wrongSlot = s.slots.findIndex((x, i) => i !== pc.home);
      const r1 = s.drop(0, wrongSlot), back = s.pieces()[0], r2 = s.dropAt(0, 390, 225), r3 = s.drop(0, pc.home);
      return { n: s.slots.length, r1, tries: q.tries, home: back.slot == null && Math.abs(back.y - 172) < 1, r2, r3, filled: s.filled(), status: document.querySelector('.sp-status').textContent, noOptions: document.getElementById('options').children.length }; });
    assert.deepEqual(m, { n: 4, r1: 'wrong', tries: 1, home: true, r2: 'back', r3: 'placed', filled: 1, status: '1 of 4 in place', noOptions: 0 });
    // a real finger drag puts a shape on its outline
    const drag = await p.evaluate(() => { const s = window.__shapePlay, pc = s.pieces().find((x) => x.slot == null), svg = document.querySelector('.sp-board'), m = svg.getScreenCTM(), to = s.slots[pc.home];
      return { i: pc.i, from: [pc.x * m.a + m.e, pc.y * m.d + m.f], to: [to.x * m.a + m.e, to.y * m.d + m.f] }; });
    await p.mouse.move(...drag.from); await p.mouse.down(); await p.mouse.move((drag.from[0] + drag.to[0]) / 2, (drag.from[1] + drag.to[1]) / 2, { steps: 4 }); await p.mouse.move(...drag.to, { steps: 4 }); await p.mouse.up();
    assert.equal(await p.evaluate((i) => window.__shapePlay.pieces()[i].slot != null, drag.i), true, 'dragged into place');
    await p.evaluate(() => window.__shapePlay.solve());
    assert.deepEqual(await p.evaluate(() => ({ done: window.__shapePlay.filled(), locked: R.locked, ok: R.qs[R.i].ok })), { done: 4, locked: true, ok: false }, 'finishing the board answers the card (not first try: one wrong drop)');
    // Build a Picture: every piece has a place; older children get only the outline of the whole picture
    await ask({ q: 'geo.build.house.s2', grade: 'k' }); await p.waitForSelector('.sp-shape-build .sp-piece');
    const bld = await p.evaluate(() => { const s = window.__shapePlay, before = s.pieces().every((x) => x.fits); s.solve(); return { n: s.slots.length, guide: s.guide, before, filled: s.filled(), ok: R.qs[R.i].ok, order: [...document.querySelectorAll('.sp-placed .sp-piece')].map((e) => +e.dataset.slot) }; });
    assert.deepEqual(bld, { n: 5, guide: 'parts', before: true, filled: 5, ok: true, order: [0, 1, 2, 3, 4] });
    await ask({ q: 'geo.build.castle.s4', grade: 'g2' }); await p.waitForSelector('.sp-slots.whole');
    assert.equal(await p.evaluate(() => window.__shapePlay.guide), 'whole');
    // Shape Puzzle: pieces start turned; dropping one unturned does not count against her; a tap turns it
    await ask({ q: 'geo.puzzle.rocket.s3', grade: 'g1' }); await p.waitForSelector('.sp-shape-puzzle .sp-piece');
    const pz = await p.evaluate(() => { const s = window.__shapePlay, q = R.qs[R.i], turned = s.pieces().filter((x) => !x.fits), pc = turned[0];
      const r1 = s.drop(pc.i, pc.home), t0 = pc.turn; s.turn(pc.i); const t1 = s.pieces()[pc.i].turn; s.solve();
      return { turning: s.turning, turned: turned.length, r1, tries: q.tries, quarter: (t1 - t0 + 360) % 360, filled: s.filled(), n: s.slots.length, tip: !!document.querySelector('.sp-tip'), ok: q.ok }; });
    assert.ok(pz.turned >= 3, 'most pieces start turned: ' + pz.turned);
    assert.deepEqual({ ...pz, turned: 0 }, { turning: true, turned: 0, r1: 'turn', tries: 0, quarter: 90, filled: 6, n: 6, tip: true, ok: true });
    // a tap on the screen turns a piece too
    await ask({ q: 'geo.puzzle.house.s3', grade: 'g1' }); await p.waitForSelector('.sp-shape-puzzle .sp-piece');
    const tap = await p.evaluate(() => { const s = window.__shapePlay, pc = s.pieces().find((x) => !x.fits), m = document.querySelector('.sp-board').getScreenCTM(); return { i: pc.i, turn: pc.turn, at: [pc.x * m.a + m.e, pc.y * m.d + m.f] }; });
    await p.mouse.click(...tap.at);
    assert.equal(await p.evaluate((t) => (window.__shapePlay.pieces()[t.i].turn - t.turn + 360) % 360, tap), 90);
    // ---- match with lines, and tap-all
    await ask({ q: 'geo.lines.side.s3', grade: 'g1' }); await p.waitForSelector('.m-item');
    const lines = await p.evaluate(() => { const L = [...document.querySelectorAll('.m-item.L')], Rr = [...document.querySelectorAll('.m-item.R')];
      for (const l of L) { l.click(); Rr.find((r) => r.dataset.id === l.dataset.id).click(); }
      return { pairs: L.length, drawn: document.querySelectorAll('.m-lines line, .m-lines path.m-line').length, pics: document.querySelectorAll('.m-item svg').length, locked: R.locked }; });
    assert.equal(lines.pairs, 4); assert.ok(lines.drawn >= 4, 'a line for each pair: ' + lines.drawn); assert.equal(lines.pics, 8); assert.ok(lines.locked);
    await ask({ q: 'geo.all.roll.s3', grade: 'g1' }); await p.waitForSelector('#options button');
    const multi = await p.evaluate(() => { const q = R.qs[R.i], btn = [...document.getElementById('options').children], right = btn.filter((x, k) => q.multi.includes(q.options[k].v)), wrong = btn.find((x, k) => !q.multi.includes(q.options[k].v));
      wrong.click(); right.slice(0, 2).forEach((x) => x.click()); const mid = { locked: R.locked, status: document.querySelector('.multi-status').textContent, tries: q.tries }; right[2].click();
      return { options: btn.length, want: q.multi.length, mid, locked: R.locked }; });
    assert.deepEqual(multi, { options: 5, want: 3, mid: { locked: false, status: '2 of 3 found', tries: 1 }, locked: true });
    // ---- the lesson: one scene and caption per line, a solid then its flat shape, then a question together
    const lesson = await p.evaluate(() => { state.grade = 'k'; const c = BankCards.intro(QuestionBank.lesson('shape2', 2, 'k')); const d = document.createElement('div'); d.innerHTML = c.main;
      const scenes = [...d.querySelectorAll('.s2f-scene')];
      return { title: c.text, steps: c.steps.length, scenes: scenes.length, rows: scenes.map((s) => +s.dataset.row).join(), third: { solid: !!scenes[2].querySelector('.s2f-look-side svg'), flat: !!scenes[2].querySelector('.s2f-flat.s2f-pop svg'), names: [...scenes[2].querySelectorAll('.s2f-name')].map((n) => n.textContent), cap: scenes[2].querySelector('.s2f-cap').textContent },
        last: scenes.at(-1).classList.contains('s2f-keep') && scenes.at(-1).querySelectorAll('.s2f-pair').length, guided: c.guided && c.guided.key }; });
    assert.equal(lesson.title, 'Solid shapes and flat shapes'); assert.equal(lesson.steps, 8); assert.equal(lesson.scenes, 8); assert.equal(lesson.rows, '1,2,3,4,5,6,7,8');
    assert.deepEqual(lesson.third, { solid: true, flat: true, names: ['cone', 'triangle'], cap: 'Look at the cone from the side. You see a triangle!' });
    assert.equal(lesson.last, 2); assert.equal(lesson.guided, 'geo.view.cone-side');
    assert.deepEqual(errors, []);
    console.log('PASS geometry sequence: animated lesson, lines, one-answer and tap-all questions, Shape Match, Build a Picture (9 pictures) and Shape Puzzle, all from one question set', JSON.stringify(set.kinds));
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
