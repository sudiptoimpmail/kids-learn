const assert = require('node:assert/strict');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome',
    args: ['--no-sandbox']
  });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://localhost:8765/index.html');
    await page.locator('#startBtn').click();
    assert.equal(await page.locator('#splash').evaluate(x => x.classList.contains('gone')), true,
      'splash should close after one tap');

    // An in-tab service worker upgrade/reload must never demand a second Let's Play tap.
    await page.reload();
    assert.equal(await page.locator('#splash').evaluate(x => x.classList.contains('gone')), true,
      'splash reappeared after reload and would require a second tap');

    // The reset button requires a user confirmation. Explicitly test it separately.
    const settings = await page.evaluate(() => {
      const original = window.confirm; window.confirm = () => true;
      state.country = 'ca'; state.dailyGoal = 15; state.stars = 40; save();
      document.querySelector('#resetBtn').click();
      window.confirm = original;
      if (state.country !== 'ca' || state.dailyGoal !== 15 || state.stars !== 0)
        throw Error('Progress reset deleted parent country/goal settings or retained stars');
      return {country:state.country,goal:state.dailyGoal,stars:state.stars};
    });

    const findings = await page.evaluate(async () => {
      const fails = [];
      state.voice = false; state.grade = 'g1'; state.stats = { days:{}, skills:{} };
      state.stats.days[dayKey()] = {q:0,brain:2,traced:1,secs:120,play:0,cats:{}};
      if (dayStreak() !== 1) fails.push('Brain/tracing-only learning day not counted');
      renderDashboard();
      if (!document.querySelector('#dashTop').textContent.includes('1'))
        fails.push('Dashboard did not show a learning day');

      startRound('add', 4);
      let q = R.qs[R.i];
      const answerIndex = q.options.findIndex(o => String(o.v) === String(q.answer));
      R.locked = false;
      choose(q,q.answer, document.querySelectorAll('#options .opt')[answerIndex]);
      if (!document.querySelector('#pop').classList.contains('show'))
        fails.push('Correct answer gave no positive feedback');
      // Start another round while the previous reward is still animating.
      startRound('sub', 4);
      if (document.querySelector('#pop').classList.contains('show') || document.querySelector('#pop').textContent.trim())
        fails.push('Stale Brilliant popup appeared on unanswered question');
      q = R.qs[R.i]; const wrongIndex = q.options.findIndex(o => String(o.v) !== String(q.answer));
      let pending, oldSay = say, oldHint = speakHint, hinted = 0;
      try {
        say = () => new Promise(res => { pending = res; });
        speakHint = () => { hinted++; };
        choose(q, q.options[wrongIndex].v, document.querySelectorAll('#options .opt')[wrongIndex]);
        startRound('add',4);
        pending?.();
        await Promise.resolve(); await Promise.resolve();
        if (hinted) fails.push('Old question hint spoke after a new question started');
      } finally { say = oldSay; speakHint = oldHint; }

      const sizes = [];
      for (const level of [1,2,3,4,5]) {
        let blocks = 0;
        for (let n = 0; n < 2500; n++) {
          const question = genNumSense(level), opts = question.options.map(o => String(o.v));
          if (opts.filter(v => v === String(question.answer)).length !== 1 || new Set(opts).size !== opts.length)
            fails.push('Malformed Number Sense choices: ' + question.key);
          if (level >= 3 && /^ns-(eo|blocks|skip)-/.test(question.key))
            fails.push('Advanced Number Sense unexpectedly fell back to Level 1');
          if (question.key.startsWith('ns-blocks-')) {
            blocks++; const val = +question.key.split('-').at(-1);
            if (val > 39) fails.push('Too many blocks for beginning student: ' + val);
            const rods = (question.main.match(/class="ns-rod"/g) || []).length;
            const cubes = (question.main.match(/class="ns-cube"/g) || []).length;
            if (rods > 3 || cubes > 9) fails.push('Base ten blocks not properly grouped: ' + val);
          }
        }
        sizes.push({level,blocks});
      }
      const q1 = genGrammar(1);
      // all three choices must come from the one sentence, so the child judges each word's job
      const words = q1.options.map(o => String(o.v));
      if (!/The \w+ \w+ can \w+\./.test(q1.main) || !words.every(w => q1.main.includes(w)))
        fails.push('First-grade noun/verb choices are not all from the sentence');
      document.querySelector('#qMain').innerHTML = nsBlocks(38);
      const block = document.querySelector('#qMain .ns-blocks');
      if (!block || !block.querySelector('.ns-rod') || !block.querySelector('.ns-cube'))
        fails.push('Missing rendered base-ten blocks');
      return {fails,sizes,learningDay:dayStreak(),settingsCountry:state.country};
    });
    assert.deepEqual(findings.fails, [], JSON.stringify(findings, null, 2));
    assert.deepEqual(settings, { country:'ca',goal:15,stars:0 });
    assert.deepEqual(errors, [], errors.join('\n'));
    console.log('PASS child regressions', JSON.stringify(findings));
    await page.close();
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
