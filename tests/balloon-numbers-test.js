// Balloons: earlier numbers still pop while their balloons are in the air, older grades get little sums, and some
// rounds ask for a word.
const assert = require('node:assert/strict'), { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN });
  try {
    const p = await b.newPage({ viewport: { width: 1180, height: 820 } }); const errors = [];
    p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => { if (/Missing natural recording/.test(m.text())) errors.push(m.text()); });
    await p.goto('http://localhost:8765/'); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
    const open = (grade) => p.evaluate((g) => { document.getElementById('splash').style.display = 'none'; state.name = 'Maya'; state.grade = g; state.playAlways = true; state.testMode = false; state.voice = true; state.gameLv = {}; state.gameWins = {}; window.__pop = null; openGame('pop'); return !!window.__pop; }, grade);
    // ---- Pre-K: after the number changes, the earlier number's balloons still pop; new decoys never show it
    assert.ok(await open('prek'));
    const old = await p.evaluate(() => { const g = window.__pop, first = g.ask(); for (let k = 0; k < 40; k++) g.spawn();
      const mine = () => g.balloons().filter((x) => x.n === first);
      for (let k = 0; k < 3; k++) { const t = mine()[0]; g.tapAt(t.x, t.y); }
      const left = mine().length, changed = g.ask() !== first, allStill = mine().every((x) => x.still);
      for (let k = 0; k < 30; k++) g.spawn();
      const fresh = g.balloons().filter((x) => x.n === first && !x.still).length, s = g.score(), t = mine()[0], r = g.tapAt(t.x, t.y);
      const wrong = g.balloons().find((x) => x.n !== g.ask() && !x.still), rw = g.tapAt(wrong.x, wrong.y);
      return { left, changed, allStill, fresh, r, gained: g.score() - s, rw, labels: g.balloons().every((x) => x.label === String(x.n)) }; });
    assert.ok(old.left > 3 && old.changed, 'the number asked for changes after three pops');
    assert.deepEqual({ allStill: old.allStill, fresh: old.fresh, r: old.r, gained: old.gained, rw: old.rw, labels: old.labels }, { allStill: true, fresh: 0, r: 'pop', gained: 1, rw: 'bounce', labels: true }, 'earlier balloons still pop, no new decoy shows that number, Pre-K sees plain numbers');
    // ---- sums: 1st grade adds, 2nd also takes away, 3rd also multiplies; every sum makes the balloon's number
    const sums = async (grade) => { await open(grade); return p.evaluate(() => { const g = window.__pop, kinds = new Set(), bad = [];
      for (let n = 1; n <= 20; n++) for (let k = 0; k < 60; k++) { const l = g.label(n), m = /^(\d+)([+−×])(\d+)$/.exec(l);
        if (!m) { if (l !== String(n)) bad.push(l); kinds.add('n'); continue; } kinds.add(m[2]);
        const v = m[2] === '+' ? +m[1] + +m[3] : m[2] === '−' ? m[1] - m[3] : m[1] * m[3]; if (v !== n || l.length > 5) bad.push(l); }
      return { kinds: [...kinds].sort().join(''), bad }; }); };
    assert.deepEqual(await sums('k'), { kinds: 'n', bad: [] });
    assert.deepEqual(await sums('g1'), { kinds: '+n', bad: [] });
    assert.deepEqual(await sums('g2'), { kinds: '+n−', bad: [] });
    assert.deepEqual(await sums('g3'), { kinds: '+n×−', bad: [] });
    // ---- word rounds from Kindergarten: the heading says so, it can be read out, and the word balloons pop
    await open('k');
    const word = await p.evaluate(() => { const g = window.__pop; let n = 0;
      while (typeof g.ask() !== 'string' && n++ < 400) { g.spawn(); const t = g.balloons().find((x) => x.n === g.ask()); if (t) g.tapAt(t.x, t.y); }
      const ask = g.ask(), had = g.balloons().length; for (let k = 0; k < 12; k++) g.spawn(); const t = g.balloons().find((x) => x.n === ask), decoys = g.balloons().slice(had).filter((x) => x.n !== ask);
      return { ask, head: document.querySelector('.g-msg').textContent, said: CoreVoice.canSay(['Pop the word', ask]), r: g.tapAt(t.x, t.y), label: t.label, decoyWords: decoys.length > 0 && decoys.every((x) => typeof x.n === 'string') }; });
    assert.equal(typeof word.ask, 'string', 'a word round comes up'); assert.match(word.head, new RegExp('Pop the word ' + word.ask));
    assert.deepEqual({ said: word.said, r: word.r, label: word.label === word.ask, decoyWords: word.decoyWords }, { said: true, r: 'pop', label: true, decoyWords: true });
    await open('prek'); assert.equal(await p.evaluate(() => { const g = window.__pop; for (let k = 0; k < 200; k++) { g.spawn(); const t = g.balloons().find((x) => x.n === g.ask()); g.tapAt(t.x, t.y); if (typeof g.ask() === 'string') return false; } return true; }), true, 'Pre-K stays with numbers');
    assert.deepEqual(errors, []);
    console.log('PASS balloons: earlier numbers keep popping, sums for older grades, word rounds', JSON.stringify({ word: word.ask }));
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
