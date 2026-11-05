// Question identity and saved-level safety: verify delivered cards, not just bank IDs.
const assert = require('node:assert/strict');
const {chromium} = require('playwright');

(async () => {
  const browser = await chromium.launch({executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome', args: ['--no-sandbox']});
  try {
    const page = await browser.newPage();
    await page.goto('http://localhost:8765/index.html');
    await page.waitForFunction(() => !!window.KidsLearnReady);
    await page.evaluate(() => window.KidsLearnReady);
    const result = await page.evaluate(() => {
      state.testMode = false;
      state.showAll = false;
      const mismatches = [];
      for (const grade of ['prek', 'k', 'g1', 'g2', 'g3']) {
        state.grade = grade;
        for (const c of CATEGORIES.filter(c => c.gen && c.id !== 'placement')) {
          const range = gradeRange(grade, c.id);
          if (!range) continue;
          state.levels[c.id] = 99; // stale saved progress from a different grade
          if (levelOf(c.id) !== range[1]) mismatches.push(grade + '/' + c.id + ': displayed top level mismatch');
          state.levels[c.id] = 1;
          if (levelOf(c.id) !== range[0]) mismatches.push(grade + '/' + c.id + ': displayed floor mismatch');
        }
      }

      // Force identical rendered questions under different generator keys.
      // Previous logic admitted duplicates after the retry guard was reached.
      state.grade = 'g2'; state.recent = {}; state.recentContent = {};
      const cat = CATEGORIES.find(c => c.id === 'gk'), old = cat.gen;
      let calls = 0, sameRound = 0;
      try {
        cat.gen = () => ({key: 'different-id-' + (++calls), text: 'Which is correct?',
          main: '', answer: 'Yes', options: [{v:'Yes',html:'Yes'},{v:'No',html:'No'},{v:'Maybe',html:'Maybe'}]});
        startRound('gk', 4);
        sameRound = R.qs.length;
      } finally { cat.gen = old; }
      return {mismatches, sameRound, calls, history: (state.recentContent.gk || []).length};
    });
    assert.deepEqual(result.mismatches, [], 'badge and grade range disagree');
    assert.equal(result.sameRound, 1, 'same visible question appeared twice despite different keys');
    assert.ok(result.calls >= 4, 'generator collision was not exercised');
    assert.equal(result.history, 1, 'bounded semantic history should store one question');
    console.log('PASS grade badge clamp and semantic same-round question deduplication');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
