// Jobs, served from its question bank (banks/learn-play.jobs.json): illustrated workers and their things. Pre-K finds the worker; Kindergarten learns the names (helmet, fire hose,
// stethoscope ...) after a lesson that names each one; 1st grade is also asked what each thing is for.
const assert = require('node:assert/strict'), { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN });
  try {
    const p = await b.newPage({ viewport: { width: 820, height: 1180 } }); const errors = [];
    p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => { if (/Missing natural recording|hook for/.test(m.text())) errors.push(m.text()); });
    await p.goto('http://localhost:8765/?teach=1'); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
    const r = await p.evaluate(() => {
      document.getElementById('splash').style.display = 'none'; state.name = 'Maya'; state.voice = true; state.testMode = false; state.country = 'us';
      const out = { bad: [], ranges: {}, kinds: {} }, cat = CATEGORIES.find((c) => c.id === 'jobs'), bank = QuestionBank.get('learn-play.jobs');
      const said = (s) => [].concat(s).every((t) => CoreVoice.canSay(t)), kind = (n) => n.split('-').pop();
      const workers = bank.pictures.map((x) => x.alt);
      out.workers = workers; out.unrecorded = QuestionBank.spoken(bank).filter((t) => !CoreVoice.canSay(t));
      out.problems = QuestionBank.check(bank, { grades: ['prek', 'k', 'g1', 'g2', 'g3'] });
      for (const w of bank.pictures) if (w.tags.length !== 4) out.bad.push(w.alt + ' needs four named things');
      out.steps = BankCards.stepTitles('jobs'); out.maxLevel = cat.maxLevel;
      out.jobs = [...new Set(bank.questions.filter((q) => /^jobs\.who\./.test(q.id)).flatMap((q) => q.choices.map((c) => c.text)))];
      for (const g of ['prek', 'k', 'g1', 'g2']) { state.grade = g; const range = gradeRange(g, 'jobs'); out.ranges[g] = range || null; if (!range) continue;
        for (let lv = range[0]; lv <= range[1]; lv++) { const seen = new Set();
          const intro = cat.teach(lv), worker = workers[lv - 2];
          if (lv >= 2 && lv <= workers.length + 1) {
            if (!intro || !/^This is an? /.test(intro.steps[0].say) || !intro.steps[0].say.includes(worker) || intro.steps.filter((s) => s.row).length !== 8 || !intro.steps.every((s) => said(s.say)) || !intro.guided) out.bad.push(`${g}:${lv} lesson missing, incomplete or not recorded`);
          } else if (intro) out.bad.push(`${g}:${lv} should have no worker lesson`);
          for (let i = 0; i < 300; i++) { const q = cat.gen(lv), where = `${g}:${lv} ${q.key}`, src = QuestionBank.question(q.key.split('~')[0]);
            seen.add(q.key.split('.').slice(0, 3).filter((x, n) => n !== 1 || /^(find|who|name|does|match)$/.test(x)).join('.').replace(/\.[a-z0-9-]+$/, (m) => (/^\.(tap|pick|whose|use)$/.test(m) ? m : '')));
            if (!src) { out.bad.push(where + ' is not from the bank'); continue; }
            if (!src.grades.includes(g)) out.bad.push(where + ' is for ' + src.grades);
            if (!gradeFits(q, g, 'jobs')) out.bad.push(where + ' does not fit the grade');
            if (!said(q.say) || (q.hint && !said(q.hint.say)) || (q.explain && !said(q.explain))) out.bad.push(where + ' not recorded');
            if (q.match) { if (q.match.left.length !== src.show || new Set(q.match.left.map((x) => x.html)).size !== src.show) out.bad.push(where + ' pairs'); continue; }
            if (q.tap) { if (!q.main.includes(`data-val="${q.answer}"`) || !q.main.includes('role="button"')) out.bad.push(where + ' tap target missing'); continue; }
            if (q.options.filter((o) => o.v === q.answer).length !== 1 || q.options.length !== src.choices.length) out.bad.push(where + ' needs exactly one right choice');
            if (/\.(pick|use)\./.test(q.key)) { const names = src.choices.map((c) => c.picture.split('#')[1]); if (new Set(names.map(kind)).size !== names.length) out.bad.push(where + ' two choices of the same kind: ' + names);
              if (/\.use\./.test(q.key) && new Set(src.choices.map((c) => c.picture.split('#')[0])).size !== 1) out.bad.push(where + ' use choices must come from one worker'); }
            if (g === 'prek' && !/^jobs\.(find|who|match)\./.test(q.key)) out.bad.push(where + ' Pre-K only meets the workers');
            if (g === 'k' && /\.use\./.test(q.key)) out.bad.push(where + ' "what is it for" before 1st grade');
          }
          out.kinds[`${g}:${lv}`] = [...seen].sort().join(' ');
        } }
      return out;
    });
    assert.deepEqual(r.problems, []);
    assert.deepEqual(r.ranges, { prek: [1, 1], k: [1, 5], g1: [2, 10], g2: null });
    assert.deepEqual(r.workers, ['firefighter', 'doctor', 'police officer', 'soldier', 'builder', 'chef', 'farmer', 'astronaut']);
    assert.deepEqual(r.steps, ['Who helps us?', 'Firefighter', 'Doctor', 'Police officer', 'Soldier', 'Builder', 'Chef', 'Farmer', 'Astronaut', 'All the jobs']); assert.equal(r.maxLevel, 10);
    assert.deepEqual(r.unrecorded, []); assert.deepEqual([...new Set(r.bad)].slice(0, 10), []);
    assert.ok(['soldier', 'librarian', 'lifeguard'].every((j) => r.jobs.includes(j)), 'more roles');
    for (const k of ['pick', 'tap', 'whose']) assert.match(r.kinds['k:2'], new RegExp(k)); assert.doesNotMatch(r.kinds['k:2'], /use/);
    assert.match(r.kinds['g1:3'], /use/); assert.match(r.kinds['prek:1'], /find/); assert.match(r.kinds['prek:1'], /match/); assert.match(r.kinds['g1:10'], /does/);
    // the lesson: the worker is named, then each thing lights up with its name and what it is for; then the quiz
    const round = await p.evaluate(() => { state.grade = 'k'; state.taught = {}; state.levels = { ...state.levels, jobs: 2 }; startRound('jobs');
      return { lessons: R.qs.filter((q) => q.lesson).map((q) => q.lesson), labels: [...document.querySelectorAll('#qMain .hw-label')].map((x) => x.textContent), opts: document.querySelectorAll('#options .opt').length }; });
    assert.deepEqual(round, { lessons: ['intro', 'guided'], labels: ['helmet', 'jacket', 'boots', 'fire hose'], opts: 0 });
    await p.waitForSelector('#qMain .hw-part.on', { timeout: 30000 });
    assert.ok(await p.evaluate(() => { const part = document.querySelector('#qMain .hw-part.on'), label = document.querySelector('#qMain .hw-label.on'); return !!label && part.dataset.val === label.textContent; }), 'the thing and its label light up together');
    await p.waitForSelector('#teachNext:not([hidden]) [data-a="go"]', { timeout: 120000 });
    await p.click('#teachNext [data-a="go"]');
    await p.evaluate(() => { const q = R.qs[R.i]; [...document.querySelectorAll('#options .opt')].find((x) => String(x.dataset.v) === String(q.answer)).click(); });
    await p.waitForFunction(() => R.qs.every((q) => !q.lesson), null, { timeout: 9000 });
    assert.ok(await p.evaluate(() => !!state.taught['jobs:2'] && R.qs.every((q) => /^jobs\.firefighter\.(tap|pick|whose)\./.test(q.key))), 'the quiz is about the firefighter');
    // tapping the right thing on the picture counts
    await p.waitForTimeout(600);
    const tapped = await p.evaluate(async () => { const q = BankCards.card(QuestionBank.question('jobs.firefighter.tap.fire-hose'));
      q.cat = R.cat; q.level = 2; R.qs[R.i] = q; renderQ(); const before = R.firstTry;
      document.querySelector('#qMain [data-val="fire hose"]').dispatchEvent(new MouseEvent('click', { bubbles: true })); await new Promise((r) => setTimeout(r, 300));
      return R.firstTry - before; });
    assert.equal(tapped, 1, 'tapping the fire hose is right');
    assert.deepEqual(errors, []);
    console.log('PASS jobs from the question bank: 8 workers with 32 named things, lesson then quiz, tap the thing, per-grade questions, every line recorded');
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
