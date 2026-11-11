// Teach first: a new skill step opens with a modelled card and a guided card, which never count as evidence.
const assert = require('node:assert/strict'), { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN });
  try {
    const p = await b.newPage({ viewport: { width: 1080, height: 810 } }); const errors = [];
    p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => { if (/Missing natural recording|hook for/.test(m.text())) errors.push(m.text()); });
    await p.goto('http://localhost:8765/'); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
    await p.evaluate(() => { localStorage.removeItem(AppConfig.storage.key + '.qa'); document.getElementById('splash').style.display = 'none';
      state.name = 'Maya'; state.grade = 'k'; state.voice = true; state.taught = {}; state.testMode = false; save(); });
    const roundInfo = () => p.evaluate(() => ({ n: R.qs.length, lessons: R.qs.filter((q) => q.lesson).map((q) => q.lesson), kind: document.getElementById('teachBar')?.dataset.kind }));
    // 1. first time: model + guided cards, then the full quiz
    await p.evaluate(() => startRound('add'));
    let r = await roundInfo(); assert.deepEqual(r.lessons, ['model', 'guided']); assert.equal(r.n, 7);
    assert.equal(await p.evaluate(() => getComputedStyle(document.querySelector('#options .opt')).pointerEvents), 'none', 'the child only watches the model');
    await p.waitForSelector('#teachNext:not([hidden]) [data-a="go"]', { timeout: 40000 });
    assert.ok(await p.evaluate(() => document.querySelectorAll('#qMain .teach-count').length >= 1), 'Professor Hoot counts the objects');
    const before = await p.evaluate(() => ({ days: JSON.stringify(state.stats && state.stats.days), play: JSON.stringify([state.playBank, state.playEarned, state.playRounds]) }));
    await p.click('#teachNext [data-a="go"]');
    r = await roundInfo(); assert.equal(r.kind, 'guided');
    assert.ok(await p.evaluate(() => document.querySelectorAll('#options .opt:not([disabled])').length) <= 2, 'guided card offers two choices');
    // a wrong tap shows where to look
    await p.evaluate(() => { const q = R.qs[R.i]; [...document.querySelectorAll('#options .opt:not([disabled])')].find((x) => String(x.dataset.v) !== String(q.answer))?.click(); });
    assert.ok(await p.evaluate(() => !!document.querySelector('#options .teach-point')));
    await p.evaluate(() => { const q = R.qs[R.i]; [...document.querySelectorAll('#options .opt')].find((x) => String(x.dataset.v) === String(q.answer)).click(); });
    await p.waitForFunction(() => R.qs.every((q) => !q.lesson), null, { timeout: 8000 });
    r = await roundInfo(); assert.equal(r.n, 5, 'the quiz keeps its full length'); assert.equal(r.kind, 'turn');
    const quiz = await p.evaluate(() => ({ i: R.i, firstTry: R.firstTry, mistakes: R.mistakes, taught: state.taught['add:' + R.sessionLevel],
      days: JSON.stringify(state.stats && state.stats.days), play: JSON.stringify([state.playBank, state.playEarned, state.playRounds]) }));
    assert.equal(quiz.i, 0); assert.equal(quiz.firstTry, 0); assert.equal(quiz.mistakes, 0); assert.ok(quiz.taught);
    assert.equal(quiz.days, before.days, 'lesson cards are not logged as practice evidence'); assert.equal(quiz.play, before.play, 'lesson cards earn no Play Zone time');
    // 2. the same step again: straight to the quiz
    await p.evaluate(() => startRound('add')); r = await roundInfo(); assert.deepEqual(r.lessons, []);
    // 3. a long gap brings the model back
    await p.evaluate(() => { state.taught['add:' + levelOf('add')] = '2020-01-01'; startRound('add'); });
    r = await roundInfo(); assert.deepEqual(r.lessons, ['model', 'guided'], 'retaught after a long gap');
    // 4. never in test previews
    await p.evaluate(() => { state.taught = {}; startRound('add', null, true); }); r = await roundInfo(); assert.deepEqual(r.lessons, []);
    // 5. every taught skill script names only known actions and recorded phrases
    const bad = await p.evaluate(() => {
      const out = [];
      for (const [cat, steps] of Object.entries(TeachFirst.scripts)) for (const s of steps) {
        const a = s.startsWith('say:') ? 'say' : s; if (!TeachFirst.actions.includes(a)) out.push(cat + ':' + s);
        if (a === 'say' && !TeachFirst.phrases[s.slice(4)]) out.push(cat + ':' + s);
      }
      for (const t of Object.values(TeachFirst.phrases)) if (!CLIPS[clipKey(t)]) out.push('not recorded: ' + t);
      return out;
    });
    assert.deepEqual(bad, []);
    assert.deepEqual(errors, []);
    console.log('PASS teach first: model and guided cards, full quiz, no evidence or play credit, reteach after a gap, skipped in previews');
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
