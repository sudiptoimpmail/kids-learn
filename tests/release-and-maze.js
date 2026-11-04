const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');

(async () => {
  assert.match(fs.readFileSync('app-config.js', 'utf8'), /qaTools:\s*false\b/,
    'Release configuration must default to OFF');
  assert.doesNotMatch(fs.readFileSync('app.js', 'utf8'), /new\s+SpeechSynthesisUtterance\s*\(/,
    'Mechanical browser voice must never narrate learning content');

  const browser = await chromium.launch({
    executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome',
    args: ['--no-sandbox']
  });
  try {
    const prod = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    const p = await prod.newPage(), prodErrors = [];
    p.on('pageerror', e => prodErrors.push(e.message));
    await p.goto('http://localhost:8765/index.html');
    const prodResult = await p.evaluate(() => {
      state.testMode = true; state.grade = 'g1'; applyTheme(); openSettings();
      return { available: QA_AVAILABLE, mode: isQAMode(),
        visible: !document.getElementById('testSection').hidden,
        testClass: document.body.classList.contains('test-mode'),
        pinchScope: typeof onNavigationScreen === 'function' };
    });
    assert.deepEqual(prodResult, { available: false, mode: false, visible: false, testClass: false, pinchScope: true });
    assert.deepEqual(prodErrors, [], 'Production page JavaScript errors');
    await prod.close();

    const qa = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    const q = await qa.newPage(), errors = [];
    q.on('pageerror', e => errors.push(e.message));
    await q.route('**/app-config.js', route => route.fulfill({
      contentType: 'text/javascript', body: 'const APP_FEATURES = Object.freeze({ qaTools: true });'
    }));
    await q.goto('http://localhost:8765/index.html');
    await q.evaluate(() => document.getElementById('startBtn').click());
    const result = await q.evaluate(async () => {
      state.grade = 'g1';
      state.testMode = false; applyTheme(); openSettings();
      if (document.getElementById('testSection').hidden) throw Error('QA toggle should be visible on QA builds');
      document.getElementById('testMode').checked = true;
      document.getElementById('testMode').dispatchEvent(new Event('change'));
      if (!isQAMode()) throw Error('QA setting did not enable');
      const before = { stars: state.stars, passes: state.playPasses || 0,
        recent: JSON.stringify(state.recent || {}), level: JSON.stringify(state.levels || {}) };
      startRound('add', 5);
      if (!R.browse) throw Error('QA mode incorrectly permits earned learning rounds');
      const answer = R.qs[0].answer;
      document.getElementById('qaRevealBtn').click();
      if (!document.getElementById('qText').textContent.includes(String(answer)))
        throw Error('Reveal answer failed');
      document.getElementById('qZoomIn').click();
      if (!document.getElementById('qZoomInner').style.transform.includes('scale('))
        throw Error('Question zoom failed');
      document.getElementById('qZoomReset').click();
      for (let i = 0; i < 5; i++) document.getElementById('skipBtn').click();
      if (document.getElementById('play').classList.contains('active')) throw Error('QA skip did not leave finished round');
      if (state.stars !== before.stars || (state.playPasses || 0) !== before.passes ||
          JSON.stringify(state.recent || {}) !== before.recent || JSON.stringify(state.levels || {}) !== before.level)
        throw Error('Test mode changed learning credit or level');

      const list = EARLY_REQUIRED_WORDS;
      if (list.length !== 116 || new Set(list).size !== 116) throw Error('Early word checklist incomplete');
      for (const w of ['cat', 'fan', 'hat', 'dog', 'sun']) if (earlyWordLevel(w) !== 1)
        throw Error('A common CVC word was not recognized: ' + w);
      for (const w of ['car', 'sea', 'pie', 'owl', 'key']) if (earlyWordLevel(w) < 2)
        throw Error('Non-CVC word placed in beginner pool: ' + w);
      for (let i = 0; i < 600; i++) {
        const question = genWords(W3, 1, 'cvc');
        if (question.puzzle) throw Error('Pre-K encountered a complex puzzle');
        const word = question.key.split('-').at(-1);
        if (earlyWordLevel(word) !== 1) throw Error('Pre-K advanced word: ' + word);
      }
      const spellWords = [];
      for (let i = 0; i < 400; i++) {
        const question = genSpell(1);
        if (earlyWordLevel(question.answer) !== 1) throw Error('Pre-K spelling not CVC: ' + question.answer);
        spellWords.push(question.answer);
      }
      const availableNew = EARLY_PICTURE_WORDS.filter(([w]) => W3.some(([v]) => v === w)).map(([w]) => w);
      if (!availableNew.includes('fan') || !availableNew.includes('car'))
        throw Error('Curated word additions missing from reading');

      for (let i = 0; i < 800; i++) {
        const question = genGrammar(1);
        const sent = question.main.replace(/<[^>]+>/g, ' ');
        if (!question.options.every(o => sent.includes(String(o.v))))
          throw Error('Word Detective offered a word not in its example sentence');
        if (question.options.filter(o => String(o.v) === String(question.answer)).length !== 1)
          throw Error('Word Detective correct answer missing or duplicated');
      }
      state.testMode = false; applyTheme();
      state.grade = 'prek'; state.gameLv = { path: 1 }; openBrainGame('path');
      const small = { level: GL('path'), ...{ type: window.__pathMaze.type, cols: window.__pathMaze.cols, rows: window.__pathMaze.rows } };
      if (small.level !== 1 || small.cols !== 3 || small.rows !== 4)
        throw Error('Original Pre-K maze no longer preserved: ' + JSON.stringify(small));
      state.grade = 'g3'; state.gameLv.path = 11; openBrainGame('path');
      const radial = window.__pathMaze;
      const route = radial.route();
      if (radial.type !== 'radial' || route.length < 12)
        throw Error('Advanced radial maze not generated');
      const beforeWin = state.gameWins?.path || 0;
      radial.go(route);
      if (!radial.done() || state.gameWins.path !== beforeWin + 1)
        throw Error('Advanced radial maze cannot be solved exactly once');
      radial.go(route);
      if (state.gameWins.path !== beforeWin + 1)
        throw Error('Advanced maze rewarded repeated wins');
      return { grade1WordVariants: availableNew.length, spellVariants: new Set(spellWords).size,
        small, radial: { rings: radial.rings, sectors: radial.sectors, routeLength: route.length } };
    });
    assert.deepEqual(errors, [], 'QA browser JavaScript errors');
    console.log('PASS release/QA flags, maze complexity, grammar and reading', JSON.stringify(result));
    await qa.close();
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
