const assert = require('node:assert/strict');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome', args: ['--no-sandbox']
  });
  try {
    const page = await browser.newPage({ viewport: { width: 820, height: 1180 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://localhost:8765/index.html');
    await page.evaluate(() => localStorage.setItem('learnplay.v1',
      JSON.stringify({ name: 'Game Tester', grade: 'g2', voice: false, playAlways: false })));
    await page.reload();
    await page.locator('#startBtn').click();

    const result = await page.evaluate(async () => {
      // the reload's own save (pagehide) can overwrite the data set above, so set the grade here too
      state.grade = 'g2';
      const before = state.sdkWins || 0;
      openBrainGame('sudoku');
      state.sdkLevel = 1;
      startSudoku('nums');
      const area = document.querySelector('#gameArea');
      for (let i = 0; i < 20 && (state.sdkWins || 0) === before; i++) {
        area.querySelector('[data-a="hint"]').click();
      }
      if ((state.sdkWins || 0) !== before + 1)
        throw Error('Sudoku did not award exactly one win');
      const award = state.sdkWins;
      for (let i = 0; i < 5; i++) {
        area.querySelector('[data-a="hint"]').click();
        area.querySelector('.sdk-key').click();
        area.querySelector('.sdk-cell:not(.given)')?.click();
      }
      if (state.sdkWins !== award) throw Error('Sudoku awarded repeated wins');

      state.gameLv = state.gameLv || {};
      state.gameLv.puzzle = 1;
      openGame('puzzle');
      startPuzzle(ALL_PICS[0]);
      const board = document.querySelector('.pz-board');
      const oldWins = (state.gameWins && state.gameWins.puzzle) || 0;
      if (board.children.length !== 4) throw Error('Level 1 should have four jigsaw pieces');
      if (!window.__jigsaw || !board.querySelector('.pzl-art')) throw Error('Jigsaw pieces missing');
      board.children[0].click(); board.children[0].click();
      if (!window.__jigsaw.rotations().some(Boolean)) throw Error('Jigsaw piece did not rotate');
      window.__jigsaw.solve();
      if (((state.gameWins && state.gameWins.puzzle) || 0) !== oldWins + 1)
        throw Error('Picture Puzzle did not award one win');
      const puzzleAward = state.gameWins.puzzle;
      board.children[0].click();
      board.children[1].click();
      if (state.gameWins.puzzle !== puzzleAward)
        throw Error('Picture Puzzle awarded repeated wins');
      area.querySelector('[data-a="restart"]').click();
      if (!area.querySelector('.pz-board')) throw Error('Puzzle restart failed');
      area.querySelector('[data-a="pictures"]').click();
      if (!area.querySelector('.pic-grid')) throw Error('Picture chooser failed');
      // The delayed completion panel from the previous puzzle must not interrupt the chooser.
      await new Promise(resolve => setTimeout(resolve, 1500));
      if (area.querySelector('.end-panel'))
        throw Error('Stale puzzle result appeared over chooser');

      openBrainGame('memory');
      if (!area.querySelector('.mem-board')) throw Error('Memory did not open');
      openBrainGame('c4');
      if (area.querySelectorAll('.c4-cell').length !== 42) throw Error('Connect Four missing cells');
      // finger maze: walking the one route reaches the goal and wins once
      state.gameLv.path = 3; openBrainGame('path');
      if (!area.querySelector('.pm-cv')) throw Error('Finger Maze did not open');
      const pathWins = (state.gameWins && state.gameWins.path) || 0;
      window.__pathMaze.go(window.__pathMaze.route());
      if (!window.__pathMaze.done() || state.gameWins.path !== pathWins + 1) throw Error('Finger Maze did not finish');
      // a fresh maze: jumping straight to the goal through walls must not work
      openBrainGame('path');
      const r = window.__pathMaze.route(); window.__pathMaze.go([r[r.length - 1]]);
      if (window.__pathMaze.done()) throw Error('Finger Maze let the path go through walls');
      // word puzzles are cards inside Little Words rounds: finishing one answers the card
      const cvc = CATEGORIES.find((c) => c.id === 'cvc');
      for (const kind of ['ws', 'xw']) for (const lv of [2, 3]) {
        startRound('cvc', 3);
        let q; do { q = cvc.gen(lv); } while (!q.key.includes('-' + kind + '-'));
        R.qs[R.i] = q; renderQ();
        if (kind === 'ws') { window.__wordSearch.placed.forEach((_, i) => window.__wordSearch.find(i)); }
        else {
          const xw = window.__crossword;
          const firstOpen = [...xw.cells.keys()].find((k) => !xw.given.has(k));
          for (const [k, l] of xw.cells) if (!xw.given.has(k)) xw.type(k, l);
        }
        if (!R.locked) throw Error('Puzzle card ' + kind + ' level ' + lv + ' did not finish');
      }
      // 1st-grade screens and kindergarten tap-all / letter path: completing each answers the card; parts count
      for (const [cat, make] of [['sent', () => genWordBox(3)], ['sent', () => genPassageFill()], ['sent', () => genStoryOrder()], ['phonics', () => genVowelPath()],
        ['phonics', () => genPhonicsExtra(1)], ['shape2', () => genShapeTapAll()]]) {
        startRound(cat, 3); const q = make(); R.qs[R.i] = q; renderQ();
        if (q.fillIn) q.fillIn.lines.forEach((l, i) => { document.querySelector(`.g1-blank[data-i="${i}"]`).click(); document.querySelector(`.g1-chip[data-w="${l.answer}"]`).click(); });
        else if (q.passageFill) q.passageFill.forEach((p, i) => document.querySelector(`.g1-q[data-i="${i}"] .g1-chip[data-o="${p.answer}"]`).click());
        else if (q.order) q.order.pics.forEach((_, k) => document.querySelector(`.g1-pic-btn[data-k="${k}"]`).click());
        else if (q.letterPath) window.__letterPath.idx.slice(1).forEach((k) => window.__letterPath.step(k));
        else if (q.multi) [...document.querySelectorAll('#options .opt')].forEach((b, k) => { if (q.multi.includes(String(q.options[k].v))) b.click(); });
        if (!R.locked || q.tries) throw Error('Card ' + q.key + ' did not finish cleanly');
      }
      document.querySelector('#quitBtn').click();

      return { sudokuWins: award - before, puzzleWins: puzzleAward - oldWins,
        brainCards: (renderHome(), document.querySelectorAll('#grid [data-game]').length) };
    });
    assert.equal(errors.length, 0, errors.join('\n'));
    assert.equal(result.sudokuWins, 1);
    assert.equal(result.puzzleWins, 1);
    console.log('PASS brain game completion, navigation and smoke tests', result);
    await page.close();
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
