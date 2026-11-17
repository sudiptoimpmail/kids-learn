// Content and shell fixes from the Pre-K review.
const assert = require('node:assert/strict'), { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN });
  try {
    const p = await b.newPage({ viewport: { width: 1180, height: 820 } }); const errors = [];
    p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => { if (/Missing natural recording/.test(m.text())) errors.push(m.text()); });
    await p.goto('http://localhost:8765/'); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
    const r = await p.evaluate(() => { document.getElementById('splash').style.display = 'none'; state.name = 'Maya'; state.grade = 'prek'; state.voice = true; state.vocabSeen = {}; state.testMode = false; renderHome();
      const out = {}, tile = [...document.querySelectorAll('#grid .tile')].find((t) => /Quick Check/.test(t.textContent)); out.quickTile = !!tile;
      // Word Wonders: the quiz asks only about words she has met; the cards open with words she has not met
      const asked = (n) => { const s = new Set(); for (let i = 0; i < n; i++) s.add(genVocab(1).answer); return [...s]; };
      out.first6 = vocabLearnList(1).slice(0, 6).map((v) => v[0]); out.askedNew = asked(80).every((w) => out.first6.includes(w));
      state.vocabSeen = Object.fromEntries(out.first6.slice(0, 5).map((w) => [w, true])); out.nextUp = vocabLearnList(1)[0][0]; out.askedMet = asked(80).every((w) => state.vocabSeen[w]);
      const vq = (() => { for (let i = 0; i < 200; i++) { const q = genVocab(1); if (/^voc-pic/.test(q.key)) return q; } })(); out.hintHasPicture = /hint-pic/.test(vq.hint.html);
      const dirty = VOCAB.find((v) => v[0] === 'dirty'), share = VOCAB.find((v) => v[0] === 'share'); out.dirty = /<svg/.test(dirty[1]); out.share = share[1];
      // Inside My Body: only this grade's organs on the diagram
      const organs = (g) => { state.grade = g; const d = document.createElement('div'); d.innerHTML = organSVG(); return [...new Set([...d.querySelectorAll('[data-val]')].map((x) => x.dataset.val))].sort().join(); };
      out.prekOrgans = organs('prek'); out.kOrgans = organs('k'); out.g1Organs = organs('g1').split(',').length; out.lit = (() => { state.grade = 'prek'; const d = document.createElement('div'); d.innerHTML = organSVG('liver'); return !!d.querySelector('[data-val="liver"].hl'); })();
      // rhymes: every picture carries its word, and the words are said
      state.grade = 'k'; let rq; for (let i = 0; i < 400 && !rq; i++) { const q = genPhonicsPlus(2); if (/^ph-rhyme/.test(q.key)) rq = q; }
      out.rhyme = { named: rq.options.every((o) => o.html.includes(`<small class="ph-name">${o.v}</small>`)), said: rq.options.every((o) => rq.say.includes(o.v)), recorded: CoreVoice.canSay(rq.say) };
      // Jobs: one right answer each
      const who = QuestionBank.questions({ section: 'jobs' }).filter((q) => /^jobs\.who\./.test(q.id)); out.safe = who.filter((q) => /keeps people safe/.test(q.prompt.text)).length;
      out.police = QuestionBank.question('jobs.who.police-officer.s1').prompt.text; out.policeSaid = CoreVoice.canSay('Who makes sure people follow the law?');
      out.pilot = JSON.stringify(QuestionBank.questions({ section: 'jobs' }).filter((q) => q.interaction === 'match').map((q) => q.pairs.find((x) => x.left.label === 'pilot'))).includes('☁');
      state.grade = 'prek';
      return out; });
    assert.ok(r.quickTile, 'Quick Check has a tile');
    assert.ok(r.askedNew && r.askedMet, 'the quiz asks about words from the cards'); assert.ok(!r.first6.slice(0, 5).includes(r.nextUp), 'the cards open with a word she has not met');
    assert.ok(r.hintHasPicture && r.dirty); assert.equal(r.share, '🤝');
    assert.equal(r.prekOrgans, 'brain,heart,lungs,stomach'); assert.equal(r.kOrgans, 'brain,heart,intestines,lungs,stomach'); assert.equal(r.g1Organs, 8); assert.ok(r.lit, 'a hint can still light any organ');
    assert.deepEqual(r.rhyme, { named: true, said: true, recorded: true });
    assert.equal(r.safe, 0); assert.equal(r.police, 'Who makes sure people follow the law?'); assert.ok(r.policeSaid); assert.equal(r.pilot, false);
    // the Quick Check tile starts the check
    await p.evaluate(() => [...document.querySelectorAll('#grid .tile')].find((t) => /Quick Check/.test(t.textContent)).click());
    await p.waitForFunction(() => document.getElementById('play').classList.contains('active') && R && R.cat.id === 'placement', null, { timeout: 8000 });
    // the version is shown, and the celebration clears when the next card appears
    const shell = await p.evaluate(async () => { renderHome(); show('home'); await new Promise((r) => setTimeout(r, 800)); const pop = document.getElementById('pop'); pop.classList.add('show'); startRound('body', 5, true);
      return { version: document.getElementById('appVersion').textContent, home: document.getElementById('homeVersion').textContent, sw: (await (await fetch('sw.js')).text()).match(/PREFIX \+ 'v(\d+)'/)[1], popCleared: !pop.classList.contains('show') }; });
    assert.equal(shell.home, 'v' + shell.sw); assert.match(shell.version, new RegExp(`version ${shell.sw} · engine 1\\.13\\.1`)); assert.ok(shell.popCleared);
    // the practice card says it is practice
    assert.match(await p.evaluate(async () => (await (await fetch('data/lessons.json')).text())), /"guided": "Practice together · no stars yet"/);
    assert.deepEqual(errors, []);
    console.log('PASS review content: Quick Check tile, Word Wonders quiz and cards, Pre-K organs, named rhyme pictures, single-answer Jobs, version shown, celebration cleared');
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
