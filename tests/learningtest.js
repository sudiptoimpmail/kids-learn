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
    await page.evaluate(() => localStorage.setItem('learnplay.v1',
      JSON.stringify({ voice: false, grade: 'k', name: 'Test Child', playAlways: false })));
    await page.reload();
    await page.locator('#startBtn').click();
    const result = await page.evaluate(() => {
      const grades = ['prek', 'k', 'g1', 'g2', 'g3'];
      const ids = ['pattern', 'odd', 'sequence'];
      const audit = [];
      for (const grade of grades) {
        state.grade = grade;
        for (const id of ids) {
          const cat = CATEGORIES.find(c => c.id === id);
          if (!cat || !gradeRange(grade, id)) throw new Error(`Missing ${id} for ${grade}`);
          const [minLevel, maxLevel] = gradeRange(grade, id);
          for (let level = minLevel; level <= maxLevel; level++) {
            const keys = new Set();
            for (let n = 0; n < 160; n++) {
              const q = (cat.baseGen || cat.gen)(level);
              if (typeof q.key !== 'string' || !q.text || !q.main || !q.hint)
                throw new Error(`Malformed question ${id} level ${level}`);
              if (!Array.isArray(q.options) || q.options.length < 3)
                throw new Error(`Missing options in ${id} level ${level}`);
              if (q.options.filter(o => String(o.v) === String(q.answer)).length !== 1)
                throw new Error(`Answer missing or duplicated: ${id} level ${level}`);
              if (new Set(q.options.map(o => String(o.v))).size !== q.options.length)
                throw new Error(`Duplicate choices: ${id} level ${level}`);
              keys.add(q.key);
            }
            if (keys.size < 10)
              throw new Error(`Only ${keys.size} variants in ${id} level ${level}`);
            audit.push({ grade, id, level, variants: keys.size });
          }
        }
      }
      state.grade = 'prek';
      renderHome();
      const sections = [...document.querySelectorAll('#grid .catalog-section h2')].map(e => e.textContent);
      if (!sections.some(s => s.includes('Brain Teasers')))
        throw new Error('Brain Teasers missing from home');
      if (!document.querySelector('#grid [data-cat="pattern"]'))
        throw new Error('Pattern activity missing from home');
      // brain games sit inside Brain Teasers on the home screen, filtered by age
      const tiles = () => [...document.querySelectorAll('#grid [data-game]')].map(x => x.dataset.game);
      const early = tiles();
      if (!early.includes('memory') || early.includes('path') || early.includes('sudoku') || early.includes('c4') || early.includes('ttt') || early.includes('maze'))
        throw new Error('Pre-K brain-game age filters failed: ' + early.join(','));
      openBrainGame('memory');
      if (!document.querySelector('#game .play-clock').hidden)
        throw new Error('Brain games must not show an arcade timer');
      document.querySelector('#gameBack').click();
      if (!document.querySelector('#home').classList.contains('active')) throw new Error('Back from a brain game must go home');
      state.grade = 'g3';
      renderHome();
      const older = tiles();
      if (!older.includes('sudoku') || !older.includes('c4') || older.includes('pop'))
        throw new Error('Older child brain games failed: ' + older.join(','));
      state.playAlways = true;
      openPlayZone();
      const arcade = [...document.querySelectorAll('#pzGrid [data-game]')].map(x => x.dataset.game);
      if (!arcade.includes('pinball') || !arcade.includes('ttt') || arcade.includes('maze') || arcade.includes('memory') || !arcade.includes('path'))   // Finger Maze is a regular game
        throw new Error('Arcade games not separated: ' + arcade.join(','));
      return { combinations: audit.length, early, older, arcade, sections };
    });
    assert.equal(errors.length, 0, errors.join('\n'));
    assert.ok(result.combinations >= 23);   // every grade × activity × level in GRADES (23 today)
    console.log('PASS thinking lessons and grade-based navigation', JSON.stringify(result));
    await page.close();
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error(e); process.exitCode = 1; });
