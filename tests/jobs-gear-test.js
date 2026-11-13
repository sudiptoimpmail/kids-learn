// Jobs: illustrated workers and their things. Pre-K finds the worker; Kindergarten learns the names (helmet, fire hose,
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
      const out = { bad: [], ranges: {}, kinds: {} }, cat = CATEGORIES.find((c) => c.id === 'jobs'), W = Helpers.workers;
      const said = (s) => [].concat(s).every((t) => CoreVoice.canSay(t)), kind = (n) => n.split(' ').pop();
      out.workers = W.map((w) => w.name); out.unrecorded = Helpers.spoken().filter((t) => !CoreVoice.canSay(t));
      for (const w of W) { if (w.parts.length !== 4 || new Set(w.parts.map((x) => x.name)).size !== 4) out.bad.push(w.name + ' needs four different things');
        for (const x of w.parts) if (!w.svg.includes(`data-val="${x.name}"`)) out.bad.push(`${w.name}: ${x.name} is not in the picture`); }
      out.jobs = JOBS.map((j) => j[0]);
      for (const g of ['prek', 'k', 'g1', 'g2']) { state.grade = g; const range = gradeRange(g, 'jobs'); out.ranges[g] = range || null; if (!range) continue;
        for (let lv = range[0]; lv <= range[1]; lv++) { const seen = new Set();
          const intro = cat.teach(lv), worker = W[lv - 2];
          if (lv >= 2 && lv <= W.length + 1) {
            if (!intro || intro.steps[0].say !== `This is ${worker.article} ${worker.name}.` || intro.steps.filter((s) => s.row).length !== 8 || !intro.steps.every((s) => said(s.say))) out.bad.push(`${g}:${lv} lesson missing, incomplete or not recorded`);
          } else if (intro) out.bad.push(`${g}:${lv} should have no worker lesson`);
          for (let i = 0; i < 300; i++) { const q = cat.gen(lv), where = `${g}:${lv} ${q.key}`; seen.add(q.key.replace(/-[^-]*$/, ''));
            if (!gradeFits(q, g, 'jobs')) { if (/^job-(find|tap|pick|use|whose)/.test(q.key)) out.bad.push(where + ' does not fit the grade'); continue; }   // the round builder drops older cards that do not fit
            if (!/^job-/.test(q.key)) continue;                                                       // matching cards have their own test
            if (!said(q.say) || (q.hint && !said(q.hint.say)) || (q.explain && !said(q.explain))) out.bad.push(where + ' not recorded');
            if (!q.tap && q.options.filter((o) => o.v === q.answer).length !== 1) out.bad.push(where + ' needs exactly one right choice');
            let m;
            if ((m = /^job-tap-(.+?)-(.+)$/.exec(q.key)) && (q.answer !== m[2] || !q.main.includes(`data-val="${m[2]}"`) || !q.tap)) out.bad.push(where + ' tap target missing');
            if ((m = /^job-(pick|use)-(.+?)-(.+)$/.exec(q.key))) {
              if (q.answer !== `${m[2]}:${m[3]}`) out.bad.push(where + ' wrong answer');
              const names = q.options.map((o) => o.v.split(':')[1]); if (new Set(names.map(kind)).size !== names.length) out.bad.push(where + ' two choices of the same kind: ' + names);
              if (m[1] === 'use' && (g === 'prek' || g === 'k')) out.bad.push(where + ' "what is it for" before 1st grade');
              if (m[1] === 'use' && !q.options.every((o) => o.v.split(':')[0] === m[2])) out.bad.push(where + ' use choices must come from one worker');
            }
            if ((m = /^job-whose-(.+?)-(.+)$/.exec(q.key))) { if (q.answer !== m[1]) out.bad.push(where + ' wrong worker');
              for (const o of q.options) if (o.v !== m[1] && W.find((w) => w.id === o.v).parts.some((x) => x.name === m[2])) out.bad.push(where + ' another worker also has this'); }
            if ((m = /^job-find-(.+)$/.exec(q.key)) && g === 'prek' && !W.slice(0, 6).some((w) => w.id === m[1])) out.bad.push(where + ' not a Pre-K worker');
            if (g === 'prek' && /^job-(tap|pick|use|whose)/.test(q.key)) out.bad.push(where + ' Pre-K only meets the workers');
          }
          out.kinds[`${g}:${lv}`] = [...seen].sort().join(' ');
        } }
      return out;
    });
    assert.deepEqual(r.ranges, { prek: [1, 1], k: [1, 5], g1: [2, 10], g2: null });
    assert.deepEqual(r.workers, ['firefighter', 'doctor', 'police officer', 'soldier', 'builder', 'chef', 'farmer', 'astronaut']);
    assert.deepEqual(r.unrecorded, []); assert.deepEqual([...new Set(r.bad)].slice(0, 10), []);
    assert.ok(['soldier', 'librarian', 'lifeguard'].every((j) => r.jobs.includes(j)), 'more roles');
    assert.match(r.kinds['k:2'], /job-pick/); assert.match(r.kinds['k:2'], /job-tap/); assert.match(r.kinds['k:2'], /job-whose/); assert.doesNotMatch(r.kinds['k:2'], /job-use/);
    assert.match(r.kinds['g1:3'], /job-use/); assert.match(r.kinds['prek:1'], /job-find/);
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
    assert.ok(await p.evaluate(() => !!state.taught['jobs:2'] && R.qs.every((q) => /^(job-(tap|pick|whose)-firefighter-|vjob-)/.test(q.key)) && R.qs.some((q) => /^job-/.test(q.key))), 'the quiz is about the firefighter (with a matching card now and then)');
    // tapping the right thing on the picture counts
    await p.waitForTimeout(600);
    const tapped = await p.evaluate(async () => { let q; for (let i = 0; i < 400 && !(q && /^job-tap-firefighter-fire hose$/.test(q.key)); i++) q = Helpers.gen(2);
      q.cat = R.cat; q.level = 2; R.qs[R.i] = q; renderQ(); const before = R.firstTry;
      document.querySelector('#qMain [data-val="fire hose"]').dispatchEvent(new MouseEvent('click', { bubbles: true })); await new Promise((r) => setTimeout(r, 300));
      return R.firstTry - before; });
    assert.equal(tapped, 1, 'tapping the fire hose is right');
    assert.deepEqual(errors, []);
    console.log('PASS jobs: 8 illustrated workers with 32 named things, lesson then quiz, tap the thing, per-grade questions, every line recorded');
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
