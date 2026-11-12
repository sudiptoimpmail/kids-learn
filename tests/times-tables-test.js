// Times tables: in counting order (× 1, × 2 ... × 10, then mixed); each table is said slowly line by line, then quizzed;
// the recital repeats every day and the next table opens only after many strong rounds on several days.
const assert = require('node:assert/strict'), { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN });
  try {
    const p = await b.newPage({ viewport: { width: 1080, height: 810 } }); const errors = [];
    p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => { if (/Missing natural recording|hook for/.test(m.text())) errors.push(m.text()); });
    await p.goto('http://localhost:8765/?teach=1'); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
    const r = await p.evaluate(() => {
      document.getElementById('splash').style.display = 'none'; state.name = 'Maya'; state.voice = true; state.testMode = false;
      const cat = CATEGORIES.find((c) => c.id === 'tables'), out = { ranges: {}, bad: [], kinds: {} };
      for (const g of ['prek', 'k', 'g1', 'g2', 'g3']) {
        state.grade = g; const range = gradeRange(g, 'tables'); out.ranges[g] = range || null; if (!range) continue;
        for (let lv = range[0]; lv <= range[1]; lv++) {
          const d = TimesTables.levels[lv - 1], seen = new Set();
          const intro = cat.teach(lv);
          if (d.kind !== 'mixed') { if (intro && (intro.steps.filter((s) => s.row).length !== 10 || intro.steps[1].say !== `${d.n} times 1 is ${d.n}.` || intro.steps[10].say !== `${d.n} times 10 is ${d.n * 10}.`)) out.bad.push(`${g}:${lv} the table is not said from × 1 to × 10`);
            if (!intro || !intro.steps.every((s) => CoreVoice.canSay(s.say))) out.bad.push(`${g}:${lv} teaching card missing or not fully recorded`); }
          else if (intro) out.bad.push(`${g}:${lv} mixed step should have no table card`);
          for (let i = 0; i < 300; i++) {
            const q = cat.gen(lv); seen.add(q.key); const where = `${g}:${lv} ${q.key}`;
            const vals = q.options.map((o) => o.v);
            if (new Set(vals).size !== vals.length || vals.filter((v) => v === q.answer).length !== 1 || vals.some((v) => !(v > 0))) out.bad.push(where + ' options');
            if (!gradeFits(q, g, 'tables')) out.bad.push(where + ' does not fit the grade');
            if (!CoreVoice.canSay(q.say)) out.bad.push(where + ' question not recorded');
            if (g === 'k' && q.answer > 10) out.bad.push(where + ' Kindergarten answer above 10');
            if ((g === 'k' || g === 'g1') && /^tbl-miss-/.test(q.key)) out.bad.push(where + ' missing factor too early');
            let m;
            if ((m = /^tbl-(\d+)x(\d+)$/.exec(q.key)) && q.answer !== m[1] * m[2]) out.bad.push(where + ' wrong product');
            if ((m = /^tbl-miss-(\d+)-(\d+)$/.exec(q.key)) && q.answer !== +m[2]) out.bad.push(where + ' wrong factor');
            if ((m = /^tbl-(next|grp)-(\d+)-(\d+)$/.exec(q.key)) && q.answer !== m[2] * m[3]) out.bad.push(where + ' wrong count');
            if (d.kind === 'table' && (m = /^tbl-(?:miss-)?(\d+)[x-](\d+)$/.exec(q.key))) {
              const allowed = TimesTables.levels.slice(0, lv).filter((x) => x.kind === 'table').map((x) => x.n);
              if (!allowed.includes(+m[1]) && !allowed.includes(+m[2])) out.bad.push(where + ' table not taught yet');
            }
          }
          out.kinds[lv] = seen.size;
        }
      }
      out.order = TimesTables.levels.map((d) => d.n || d.kind);
      return out;
    });
    assert.deepEqual(r.ranges, { prek: null, k: [1, 2], g1: [1, 5], g2: [2, 10], g3: [3, 11] });
    assert.deepEqual(r.order, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 'mixed']);
    assert.deepEqual([...new Set(r.bad)].slice(0, 12), []);
    // the round: the whole table is taught first, then one card together, then the quiz
    const round = await p.evaluate(() => { state.grade = 'k'; state.taught = {}; state.levels = { ...state.levels, tables: 1 }; renderHome(); show('home'); startRound('tables');
      return { tile: !!document.querySelector('[data-cat="tables"]'), lessons: R.qs.filter((q) => q.lesson).map((q) => q.lesson), rows: document.querySelectorAll('#qMain .tt-row').length, opts: document.querySelectorAll('#options .opt').length }; });
    assert.deepEqual(round, { tile: true, lessons: ['intro', 'guided'], rows: 10, opts: 0 });
    await p.waitForSelector('#qMain .tt-row.on', { timeout: 15000 });
    await p.waitForSelector('#teachNext:not([hidden]) [data-a="go"]', { timeout: 90000 });
    assert.equal(await p.evaluate(() => document.querySelectorAll('#qMain .tt-row.done').length), 10);
    await p.click('#teachNext [data-a="go"]');
    await p.evaluate(() => { const q = R.qs[R.i]; [...document.querySelectorAll('#options .opt')].find((x) => String(x.dataset.v) === String(q.answer)).click(); });
    await p.waitForFunction(() => R.qs.every((q) => !q.lesson), null, { timeout: 9000 });
    assert.ok(await p.evaluate(() => R.qs.every((q) => /^tbl-(1x\d+|grp-1-\d+|next-1-\d+)$/.test(q.key)) && !!state.taught['tables:1']), 'Kindergarten starts with the 1 times table');
    // repetition: the table is recited again the next day, and the next table opens only after 6 strong rounds on 4 days
    const rep = await p.evaluate(() => {
      const out = {}; document.querySelector('#quitBtn').click();
      out.sameDay = TeachFirst.needsTeaching('tables', 1); state.taught['tables:1'] = new Date(Date.now() - 864e5).toISOString().slice(0, 10); out.nextDay = TeachFirst.needsTeaching('tables', 1);
      state.levels.tables = 1; state.progressionStreaks = {}; const good = { total: 5, firstTry: 5, mistakes: 0 }, RealDate = Date; out.levels = [];
      for (let i = 0; i < 8; i++) { const day = Math.floor(i / 2);   // two strong rounds a day
        globalThis.Date = class extends RealDate { constructor(...a) { super(...(a.length ? a : [RealDate.now() + day * 864e5])); } static now() { return RealDate.now(); } };
        applyRoundProgression('tables', state.levels.tables, good); out.levels.push(state.levels.tables); }
      globalThis.Date = RealDate;
      state.levels.add = 1; state.progressionStreaks.add = undefined; applyRoundProgression('add', 1, good); applyRoundProgression('add', 1, good); out.add = state.levels.add;
      return out; });
    assert.equal(rep.sameDay, false); assert.equal(rep.nextDay, true, 'the table is said again the next day');
    assert.deepEqual(rep.levels, [1, 1, 1, 1, 1, 1, 2, 2], 'next table only after 6 strong rounds on 4 different days');
    assert.equal(rep.add, 2, 'other sections keep their usual rule');
    assert.deepEqual(errors, []);
    console.log('PASS times tables: × 1 to × 10 in order, each said slowly then quizzed, recited daily, next table after 6 strong rounds on 4 days');
  } finally { await b.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
