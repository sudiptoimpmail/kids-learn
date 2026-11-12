// Curriculum review fixes: Kindergarten Compare step 2 has its own cards (two written numbers, no signs);
// Compare cards inside Adding count towards the Compare goal; every step a grade uses has a name in every country.
const assert = require('node:assert/strict'), { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN });
  try {
    const p = await b.newPage({ viewport: { width: 1080, height: 810 } }); const errors = [];
    p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => { if (/Missing natural recording|hook for/.test(m.text())) errors.push(m.text()); });
    await p.goto('http://localhost:8765/'); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
    const r = await p.evaluate(() => {
      document.getElementById('splash').style.display = 'none'; state.name = 'Maya'; state.voice = true; state.testMode = false; state.country = 'us';
      const out = { bad: [], unnamed: [] };
      // 1. Kindergarten Compare step 2
      state.grade = 'k'; state.levels = { cmp: 2 }; state.recent = {}; state.recentContent = {};
      startRound('cmp', 5, false, 2);
      out.round = R.qs.map((q) => ({ key: q.key, level: q.level, fits: gradeFits(q, 'k', 'cmp'), said: CoreVoice.canSay(q.say), signs: /[<>=]|&lt;|&gt;/.test((q.main + q.options.map((o) => o.html).join(' ')).replace(/<[^>]+>/g, ' ')) }));
      for (let i = 0; i < 300; i++) {
        const q = genCompareNumbers(2), m = /^cmpn-(\d+)-(\d+)-(m|l)$/.exec(q.key), a = +m[1], c = +m[2];
        if (a === c || a > 10 || c > 10 || q.answer !== (m[3] === 'm' ? Math.max(a, c) : Math.min(a, c)) || q.options.filter((o) => o.v === q.answer).length !== 1) out.bad.push(q.key);
      }
      document.querySelector('#quitBtn').click();
      // 2. a Compare card met inside Adding is credited to the Compare goal
      let q; for (let i = 0; i < 2000 && !(q && q.learningSource); i++) q = genAdd(2);
      out.source = q && q.learningSource;
      state.skillEvidence = {}; q.ok = true; logGradeEvidence(q, 'add', 2, true);
      out.evidence = Object.keys(state.skillEvidence);
      // 3. every step has a name, in every country
      for (const cc of COUNTRY_ORDER) { state.country = cc;
        for (const g of ['prek', 'k', 'g1', 'g2', 'g3']) { state.grade = g;
          for (const c of CATEGORIES.filter((x) => x.gen && !['mix', 'placement', 'check'].includes(x.id))) {
            const range = gradeRange(g, c.id); if (!range) continue;
            for (let lv = range[0]; lv <= range[1]; lv++) if (/· level \d/.test(skillName(c.id, lv))) out.unnamed.push(`${cc}/${g}/${c.id}:${lv}`);
          } } }
      state.country = 'ca'; out.caRegion = skillName('region', 1); state.country = 'uk'; out.ukGp = skillName('gk', 1); state.country = 'us';
      // 4. the goal nothing in the app can score says so
      state.grade = 'k'; out.goals = gradeSummaryHTML();
      return out;
    });
    assert.equal(r.round.length, 5, 'a full round of 5 cards');
    for (const q of r.round) { assert.match(q.key, /^cmpn-/, 'Kindergarten step 2 compares two written numbers: ' + q.key); assert.equal(q.level, 2); assert.ok(q.fits && q.said && !q.signs, JSON.stringify(q)); }
    assert.deepEqual(r.bad, []);
    assert.equal(r.source, 'cmp:2'); assert.deepEqual(r.evidence, ['["k","cmp:2"]']);
    assert.deepEqual(r.unnamed, []);
    assert.equal(r.caRegion, 'My province: first facts'); assert.match(r.ukGp, /colours/);
    assert.match(r.goals, /Do together/); assert.doesNotMatch(r.goals, /drawing or writing<\/b><span>Not assessed/);
    assert.deepEqual(errors, []);
    console.log('PASS curriculum fixes: Kindergarten compares written numbers, Compare cards count towards their goal, every step is named in 7 countries');
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
