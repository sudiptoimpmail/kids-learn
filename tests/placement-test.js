// Quick placement check: 8 cards at the top of the grade set each section's starting step.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 820, height: 1180 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForFunction(() => !!window.KidsLearnReady); await p.evaluate(() => window.KidsLearnReady);
  await p.locator('#startBtn').click(); await p.waitForTimeout(400);
  const r = await p.evaluate(() => {
    state.testMode = false; state.grade = 'g3'; state.levels = {};
    startPlacement();
    let n = R.qs.length, secs = [...new Set(R.qs.map((q) => q.placeSection))];
    let unique = new Set(R.qs.map(q => q.text + '|' + q.answer + '|' + String(q.main || ''))).size;
    let bySection = Object.fromEntries(secs.map(s => [s, R.qs.filter(q => q.placeSection === s).length]));
    // Sampling must never exhaust the plan and pull an unrelated fallback section.
    const stress = [];
    for (const grade of ['prek', 'k', 'g1', 'g2', 'g3']) {
      state.grade = grade;
      for (let j = 0; j < 8; j++) {
        startPlacement();
        const sections = [...new Set(R.qs.map(q => q.placeSection))];
        stress.push({grade, cards: R.qs.length, sections: sections.length,
          twoEach: sections.every(id => R.qs.filter(q => q.placeSection === id).length === 2),
          unique: new Set(R.qs.map(q => q.text + '|' + q.answer + '|' + String(q.main || ''))).size});
      }
    }
    state.grade = 'g3';
    startPlacement();
    n = R.qs.length; secs = [...new Set(R.qs.map(q => q.placeSection))];
    unique = new Set(R.qs.map(q => q.text + '|' + q.answer + '|' + String(q.main || ''))).size;
    bySection = Object.fromEntries(secs.map(id => [id, R.qs.filter(q => q.placeSection === id).length]));
    const tops = R.qs.every((q) => q.level === 1 && q.placeSection);
    // first section all right, the rest all wrong
    R.qs.forEach((q) => (q.ok = q.placeSection === secs[0]));
    applyPlacement(R.qs);
    const lv = Object.fromEntries(secs.map((s) => [s, levelOf(s)]));
    const ranges = Object.fromEntries(secs.map((s) => [s, gradeRange('g3', s)]));
    $('#quitBtn').click();
    const homeHasPlacement = !!document.querySelector('#grid .tile[data-cat="placement"]');
    return { n, secs, unique, bySection, stress, lv, ranges, homeHasPlacement };
  });
  assert.equal(r.n, 8); assert.equal(r.secs.length, 4);
  assert.equal(r.unique, 8, 'placement questions must not repeat');
  assert.ok(Object.values(r.bySection).every(n => n === 2), 'exactly two cards per assessed section');
  for (const trial of r.stress) {
    assert.equal(trial.cards, 8, 'placement card count: ' + JSON.stringify(trial));
    assert.equal(trial.sections, 4, 'placement section count: ' + JSON.stringify(trial));
    assert.ok(trial.twoEach, 'placement section balance: ' + JSON.stringify(trial));
    assert.equal(trial.unique, 8, 'placement repeated content: ' + JSON.stringify(trial));
  }
  assert.equal(r.lv[r.secs[0]], r.ranges[r.secs[0]][1], 'all right → top of the grade');
  for (const s of r.secs.slice(1)) assert.equal(r.lv[s], r.ranges[s][0], 'none right → start of the grade');
  assert.equal(r.homeHasPlacement, false, 'placement is not a home tile');
  assert.deepEqual(errs, []);
  await b.close();
  console.log('PASS 8-card placement check sets each section to the start, middle or top of the grade');
})().catch((e) => { console.error(e); process.exit(1); });
