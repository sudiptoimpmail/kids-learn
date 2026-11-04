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
      openBrainGames();
      if (document.querySelector('#pzTitle').textContent !== '🧠 Brain Games')
        throw Error('Brain Games title missing');
      openGame('sudoku');
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
      const p = ALL_PICS[0], n = 2, part = p.vb / n;
      const board = document.querySelector('.pz-board');
      function tileAt(i) {
        const v = board.children[i].querySelector('svg').getAttribute('viewBox').split(/\s+/).map(Number);
        return Math.round(v[0] / part) + n * Math.round(v[1] / part);
      }
      const oldWins = (state.gameWins && state.gameWins.puzzle) || 0;
      for (let i = 0; i < n * n; i++) {
        if (tileAt(i) === i) continue;
        const j = [...Array(n * n).keys()].find(k => tileAt(k) === i);
        if (j == null) throw Error('Could not find puzzle tile');
        board.children[i].click();
        board.children[j].click();
      }
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

      openBrainGames();
      openGame('memory');
      if (!area.querySelector('.mem-board')) throw Error('Memory did not open');
      openGame('ttt');
      if (area.querySelectorAll('.ttt-cell').length !== 9) throw Error('Tic-Tac-Toe missing cells');
      openGame('c4');
      if (area.querySelectorAll('.c4-cell').length !== 42) throw Error('Connect Four missing cells');
      openGame('maze');
      if (!area.querySelector('.ball-cv')) throw Error('Ball Maze did not open');

      return { sudokuWins: award - before, puzzleWins: puzzleAward - oldWins,
        brainCards: document.querySelectorAll('#pzGrid [data-game]').length };
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
